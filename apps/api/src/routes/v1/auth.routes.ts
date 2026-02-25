import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import { User, Company, Board, Category } from '../../models/index.js';
import { generateTokens, verifyToken } from '../../services/auth.service.js';
import { asyncHandler, AppError, apiKeyAuth, optionalSubdomainAuth } from '../../middlewares/index.js';
import { config } from '../../config/index.js';

const router = Router();

/**
 * GET /auth/google
 * Initiate Google OAuth flow
 * Query params:
 *   - companyId: Company ID to associate user with
 *   - redirect: URL to redirect after auth (for desktop apps)
 */
router.get(
  '/google',
  (req: Request, res: Response, next: NextFunction) => {
    const { companyId, redirect } = req.query;
    
    // Store state in session/query for callback
    const state = Buffer.from(JSON.stringify({ 
      companyId, 
      redirect: redirect || config.frontendUrl 
    })).toString('base64');

    passport.authenticate('google', {
      scope: ['profile', 'email'],
      state,
    })(req, res, next);
  }
);

/**
 * GET /auth/google/callback
 * Google OAuth callback
 * Handles both web redirects and desktop app deep links
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/failure' }),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const profile = req.user as { googleId: string; email: string; name: string; avatarURL?: string };
    
    if (!profile) {
      throw new AppError('authentication failed', 401);
    }

    // Decode state to get company ID and redirect URL
    let companyId: string | undefined;
    let redirectUrl = config.frontendUrl;
    
    try {
      const state = req.query.state as string;
      if (state) {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
        companyId = decoded.companyId;
        redirectUrl = decoded.redirect || config.frontendUrl;
      }
    } catch (e) {
      // Use defaults if state parsing fails
    }

    if (!companyId) {
      throw new AppError('company ID required for authentication', 400);
    }

    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      throw new AppError('company not found', 404);
    }

    // Create or update user in the company
    const user = await User.findOneAndUpdate(
      { companyID: company._id, email: profile.email },
      {
        $set: {
          name: profile.name,
          avatarURL: profile.avatarURL,
          isShadow: false,
          lastActivity: new Date(),
        },
        $setOnInsert: {
          companyID: company._id,
          userID: `google_${profile.googleId}`,
          email: profile.email,
          isAdmin: false,
          created: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Handle different redirect scenarios
    if (redirectUrl.startsWith('openfeedback://') || redirectUrl.startsWith('tauri://')) {
      // Desktop app deep link
      const deepLink = `${redirectUrl}?token=${accessToken}&refreshToken=${refreshToken}&userId=${user._id}`;
      res.redirect(deepLink);
    } else if (req.query.popup === 'true') {
      // Popup window - use postMessage
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Authentication Complete</title></head>
          <body>
            <script>
              window.opener.postMessage({
                type: 'OPENFEEDBACK_AUTH',
                token: '${accessToken}',
                refreshToken: '${refreshToken}',
                userId: '${user._id}'
              }, '${redirectUrl}');
              window.close();
            </script>
            <p>Authentication complete. This window should close automatically.</p>
          </body>
        </html>
      `);
    } else {
      // Standard web redirect with tokens in query
      const separator = redirectUrl.includes('?') ? '&' : '?';
      res.redirect(`${redirectUrl}${separator}token=${accessToken}&userId=${user._id}`);
    }
  })
);

/**
 * GET /auth/failure
 * Authentication failure handler
 */
router.get('/failure', (req: Request, res: Response) => {
  res.status(401).json({ error: 'authentication failed' });
});

/**
 * POST /auth/login
 * Email/password login
 * Extracts company from subdomain (Host header) or request body/query
 * On localhost without explicit subdomain: allows login by email alone (finds company from user)
 */
router.post(
  '/login',
  optionalSubdomainAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('email and password are required', 400);
    }

    const host = req.get('host') || req.hostname;
    const isLocalhost = host?.startsWith('localhost') || host?.match(/^\d+\.\d+\.\d+\.\d+/);
    const hasExplicitSubdomain = req.body?.subdomain || req.query?.subdomain || req.headers['x-company-subdomain'];

    let company = req.company;
    let user;

    // On localhost without explicit subdomain: find user by email alone, then get their company
    if (isLocalhost && !hasExplicitSubdomain) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw new AppError('invalid email or password', 401);
      }
      company = await Company.findById(user.companyID) ?? undefined;
      if (!company) {
        throw new AppError('company not found for this user', 404);
      }
    } else {
      // Normal flow: require company from subdomain
      if (!company) {
        throw new AppError('company not found. please check your subdomain', 404);
      }
      user = await User.findOne({ companyID: company._id, email: email.toLowerCase() });
      if (!user) {
        throw new AppError('invalid email or password', 401);
      }
    }

    // Check password (stored in customFields.passwordHash)
    const passwordHash = user.customFields?.passwordHash as string;
    if (!passwordHash) {
      throw new AppError('password login not enabled for this account', 401);
    }

    const isValid = await bcrypt.compare(password, passwordHash);
    if (!isValid) {
      throw new AppError('invalid email or password', 401);
    }

    // Update last activity
    user.lastActivity = new Date();
    await user.save();

    // Generate tokens
    const tokens = generateTokens(user);

    res.json({
      ...tokens,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        avatarURL: user.avatarURL,
        companyId: company._id.toString(),
        companyName: company.name,
        subdomain: company.subdomain,
      },
    });
  })
);

/**
 * POST /auth/signup
 * Email/password signup
 * Extracts company from subdomain (Host header) or request body/query
 */
router.post(
  '/signup',
  optionalSubdomainAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password, name, companyName } = req.body;

    if (!email || !password || !name) {
      throw new AppError('email, password, and name are required', 400);
    }

    if (password.length < 6) {
      throw new AppError('password must be at least 6 characters', 400);
    }

    let company = req.company;
    let isAdmin = false;

    // SCENARIO 1: Create new company (Explicit intent via companyName)
    if (companyName) {
      // If we are already on a subdomain, we generally shouldn't allow creating a NEW company context 
      // unless we explicitly ignore the current subdomain context for new account creation.
      // The user wants "streamlined flow", so if companyName is provided, we MUST create a new company.
      
      // Generate subdomain from company name
      const subdomain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const existingCompany = await Company.findOne({ subdomain });
      if (existingCompany) {
        throw new AppError('company with this name already exists', 409);
      }

      // Generate API key
      const { plain: apiKeyPlain, hash: apiKeyHash } = Company.generateApiKey();

      // Create company
      company = await Company.create({
        name: companyName,
        apiKey: apiKeyPlain,
        apiKeyHash,
        domainWhitelist: [],
        subdomain,
      });

      // User will be admin of this new company
      isAdmin = true;

    } else {
      // SCENARIO 2: Join existing company (Implicit intent via subdomain)
      if (!company) {
        throw new AppError('company not found. please provide companyName to create one, or check your subdomain', 404);
      }
    }

    // Check if user already exists in THIS company
    const existingUser = await User.findOne({ companyID: company._id, email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('user with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      companyID: company._id,
      userID: `email_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      isAdmin,
      isShadow: false,
      customFields: {
        passwordHash,
      },
      created: new Date(),
    });

    // Valid only for new company creation: Setup defaults
    if (isAdmin && companyName) {
      // Create default board
      const board = await Board.create({
        companyID: company._id,
        ownerID: user._id,
        name: 'Feature Requests',
        url: 'feature-requests',
        isPrivate: false,
        privateComments: false,
      });

      // Create default categories
      const defaultCategories = ['Feature Request', 'UI Improvement', 'Bug',];
      await Category.insertMany(
        defaultCategories.map(catName => ({
          companyID: company._id,
          boardID: board._id,
          createdByID: user._id,
          name: catName,
          postCount: 0,
          created: new Date(),
        }))
      );
    }

    // Generate tokens
    const tokens = generateTokens(user);

    res.status(201).json({
      ...tokens,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        avatarURL: user.avatarURL,
        companyId: company._id.toString(),
        companyName: company.name,
        subdomain: company.subdomain,
      },
    });
  })
);

/**
 * GET /auth/me
 * Get current user from JWT token
 * Requires Authorization: Bearer <token> header
 */
router.get(
  '/me',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('authorization header required', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const payload = verifyToken(token);
      const user = await User.findById(payload.userId).populate('companyID');

      if (!user) {
        throw new AppError('user not found', 404);
      }

      const company = user.companyID as any;

      res.json({
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          avatarURL: user.avatarURL,
          companyId: company._id.toString(),
          companyName: company.name,
          subdomain: company.subdomain,
        },
      });
    } catch (error) {
      throw new AppError('invalid or expired token', 401);
    }
  })
);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('refresh token required', 400);
    }

    try {
      const payload = verifyToken(refreshToken);
      const user = await User.findById(payload.userId);

      if (!user) {
        throw new AppError('user not found', 404);
      }

      const tokens = generateTokens(user);
      res.json(tokens);
    } catch (error) {
      throw new AppError('invalid refresh token', 401);
    }
  })
);

/**
 * POST /auth/verify
 * Verify a token and return user info
 */
router.post(
  '/verify',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body;

    if (!token) {
      throw new AppError('token required', 400);
    }

    try {
      const payload = verifyToken(token);
      const user = await User.findById(payload.userId);

      if (!user) {
        throw new AppError('user not found', 404);
      }

      res.json({
        valid: true,
        user: user.toJSON(),
      });
    } catch (error) {
      res.json({
        valid: false,
        error: 'invalid or expired token',
      });
    }
  })
);

/**
 * POST /auth/create_admin
 * Create an admin user for a company
 * Requires API key authentication
 * Body: { email, password, name }
 */
router.post(
  '/create_admin',
  apiKeyAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      throw new AppError('email, password, and name are required', 400);
    }

    if (password.length < 6) {
      throw new AppError('password must be at least 6 characters', 400);
    }

    const company = req.company!;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      companyID: company._id, 
      email: email.toLowerCase() 
    });
    
    if (existingUser) {
      throw new AppError('user with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    const user = await User.create({
      companyID: company._id,
      userID: `admin_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      isAdmin: true,
      isShadow: false,
      customFields: {
        passwordHash,
      },
    });

    // Generate tokens
    const tokens = generateTokens(user);

    res.status(201).json({
      ...tokens,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        avatarURL: user.avatarURL,
        companyId: company._id.toString(),
        companyName: company.name,
        subdomain: company.subdomain,
      },
    });
  })
);

/**
 * POST /auth/logout
 * Logout user (client-side token removal, this is a no-op on server)
 */
router.post('/logout', (req: Request, res: Response) => {
  res.json({ success: true, message: 'logged out' });
});

export const authRoutes = router;
