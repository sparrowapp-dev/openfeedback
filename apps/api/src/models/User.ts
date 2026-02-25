import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userID: string;
  companyID: mongoose.Types.ObjectId;
  name: string;
  email?: string | null;
  avatarURL?: string;
  alias?: string;
  isAdmin: boolean;
  isShadow: boolean;
  customFields?: Record<string, string | number | boolean>;
  companies?: Array<{
    id: string;
    name: string;
    monthlySpend?: number;
    created?: Date;
    customFields?: Record<string, string | number | boolean>;
  }>;
  lastActivity: Date;
  created: Date;
}

export interface IUserModel extends Model<IUserDocument> {
  findByIdentifier(companyID: mongoose.Types.ObjectId, identifier: {
    id?: string;
    userID?: string;
    email?: string;
  }): Promise<IUserDocument | null>;
}

const userCompanySchema = new Schema({
  id: String,
  name: String,
  monthlySpend: Number,
  created: Date,
  customFields: Schema.Types.Mixed,
}, { _id: false });

const userSchema = new Schema<IUserDocument, IUserModel>({
  userID: {
    type: String,
    required: true,
    trim: true,
  },
  companyID: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true, // Allow null/missing values
  },
  avatarURL: {
    type: String,
  },
  alias: {
    type: String,
    trim: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isShadow: {
    type: Boolean,
    default: false,
  },
  customFields: {
    type: Schema.Types.Mixed,
    default: {},
  },
  companies: [userCompanySchema],
  lastActivity: {
    type: Date,
    default: Date.now,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index: userID must be unique per company
userSchema.index({ companyID: 1, userID: 1 }, { unique: true });

// Sparse index for email lookups within a company
userSchema.index({ companyID: 1, email: 1 }, { sparse: true });

// Static method to find user by id, userID, or email (in priority order)
userSchema.statics.findByIdentifier = async function(
  companyID: mongoose.Types.ObjectId,
  identifier: { id?: string; userID?: string; email?: string }
): Promise<IUserDocument | null> {
  // Priority 1: Internal ID
  if (identifier.id) {
    if (mongoose.Types.ObjectId.isValid(identifier.id)) {
      const user = await this.findOne({ _id: identifier.id, companyID });
      if (user) return user;
    }
  }
  
  // Priority 2: External userID
  if (identifier.userID) {
    const user = await this.findOne({ userID: identifier.userID, companyID });
    if (user) return user;
  }
  
  // Priority 3: Email
  if (identifier.email) {
    const user = await this.findOne({ email: identifier.email.toLowerCase(), companyID });
    if (user) return user;
  }
  
  return null;
};

// Virtual for URL
userSchema.virtual('url').get(function() {
  return `/admin/user/${this._id}`;
});

// Transform output to API format
userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.companyID;
    delete ret.isShadow; // Internal field, not in API response
    ret.created = ret.created?.toISOString();
    ret.lastActivity = ret.lastActivity?.toISOString();
    // Remove undefined fields
    Object.keys(ret).forEach(key => {
      if (ret[key] === undefined) delete ret[key];
    });
    return ret;
  },
});

export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);
