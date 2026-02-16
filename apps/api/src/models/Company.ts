import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface ICompanyDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  apiKey: string; // Plain API key for user access
  apiKeyHash: string;
  domainWhitelist: string[];
  subdomain?: string;
  logoURL?: string;
  plan: 'free' | 'starter' | 'growth' | 'business';
  created: Date;
}

export interface ICompanyMethods {
  verifyApiKey(apiKey: string): Promise<boolean>;
}

export interface ICompanyModel extends Model<ICompanyDocument, {}, ICompanyMethods> {
  generateApiKey(): { plain: string; hash: string };
  findByApiKey(apiKey: string): Promise<ICompanyDocument | null>;
}

const companySchema = new Schema<ICompanyDocument, ICompanyModel, ICompanyMethods>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  apiKey: {
    type: String,
    required: true,
    select: false, // Don't include by default in queries
  },
  apiKeyHash: {
    type: String,
    required: true,
    index: true,
  },
  domainWhitelist: [{
    type: String,
    trim: true,
  }],
  subdomain: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  logoURL: {
    type: String,
  },
  plan: {
    type: String,
    enum: ['free', 'starter', 'growth', 'business'],
    default: 'free',
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

// Instance method to verify API key
companySchema.methods.verifyApiKey = async function(apiKey: string): Promise<boolean> {
  return bcrypt.compare(apiKey, this.apiKeyHash);
};

// Static method to generate API key
companySchema.statics.generateApiKey = function(): { plain: string; hash: string } {
  const plain = `of_${uuidv4().replace(/-/g, '')}`;
  const hash = bcrypt.hashSync(plain, 10);
  return { plain, hash };
};

// Static method to find company by API key
companySchema.statics.findByApiKey = async function(apiKey: string): Promise<ICompanyDocument | null> {
  // Since we can't search by bcrypt hash directly, we need to iterate
  // For better performance in production, consider using a prefix index or different approach
  const companies = await this.find({});
  for (const company of companies) {
    if (await company.verifyApiKey(apiKey)) {
      return company;
    }
  }
  return null;
};

// Transform output to match Canny format
companySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.apiKeyHash;
    ret.created = ret.created.toISOString();
    return ret;
  },
});

export const Company = mongoose.model<ICompanyDocument, ICompanyModel>('Company', companySchema);
