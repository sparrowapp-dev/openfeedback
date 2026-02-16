import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChangelogDocument extends Document {
  _id: mongoose.Types.ObjectId;
  companyID: mongoose.Types.ObjectId;
  title: string;
  markdownDetails: string;
  plaintextDetails: string;
  labels: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
  types: string[];
  postIDs: mongoose.Types.ObjectId[];
  status: 'draft' | 'published' | 'scheduled';
  publishedAt?: Date;
  scheduledFor?: Date;
  reactions?: {
    like?: number;
  };
  lastSavedAt: Date;
  created: Date;
}

export interface IChangelogModel extends Model<IChangelogDocument> {}

const changelogLabelSchema = new Schema({
  id: String,
  name: String,
  color: String,
}, { _id: false });

const changelogSchema = new Schema<IChangelogDocument, IChangelogModel>({
  companyID: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  markdownDetails: {
    type: String,
    default: '',
    maxlength: 100000,
  },
  plaintextDetails: {
    type: String,
    default: '',
  },
  labels: [changelogLabelSchema],
  types: [{
    type: String,
    enum: ['new', 'improved', 'fixed'],
  }],
  postIDs: [{
    type: Schema.Types.ObjectId,
    ref: 'Post',
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft',
    index: true,
  },
  publishedAt: {
    type: Date,
    index: true,
  },
  scheduledFor: {
    type: Date,
  },
  reactions: {
    like: { type: Number, default: 0 },
  },
  lastSavedAt: {
    type: Date,
    default: Date.now,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

// Compound indexes
changelogSchema.index({ companyID: 1, status: 1, publishedAt: -1 });

// Virtual for URL
changelogSchema.virtual('url').get(function() {
  return `/changelog/${this._id}`;
});

// Transform output to match Canny API format
changelogSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.companyID;
    delete ret.postIDs; // Will be populated as 'posts' array
    ret.created = ret.created?.toISOString();
    ret.publishedAt = ret.publishedAt?.toISOString() || null;
    ret.scheduledFor = ret.scheduledFor?.toISOString() || null;
    ret.lastSavedAt = ret.lastSavedAt?.toISOString();
    return ret;
  },
});

export const Changelog = mongoose.model<IChangelogDocument, IChangelogModel>('Changelog', changelogSchema);
