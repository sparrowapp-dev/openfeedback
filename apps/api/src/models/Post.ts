import mongoose, { Schema, Document, Model } from 'mongoose';

export type PostStatus = 'open' | 'under review' | 'planned' | 'in progress' | 'complete' | 'closed';

export const POST_STATUSES: PostStatus[] = [
  'open',
  'under review',
  'planned',
  'in progress',
  'complete',
  'closed',
];

export interface IPostDocument extends Document {
  _id: mongoose.Types.ObjectId;
  companyID: mongoose.Types.ObjectId;
  boardID: mongoose.Types.ObjectId;
  authorID: mongoose.Types.ObjectId;
  byID?: mongoose.Types.ObjectId;
  categoryID?: mongoose.Types.ObjectId;
  ownerID?: mongoose.Types.ObjectId;
  title: string;
  details: string;
  status: PostStatus;
  statusChangedAt?: Date;
  score: number;
  commentCount: number;
  eta?: string;
  imageURLs: string[];
  tagIDs: mongoose.Types.ObjectId[];
  jira?: {
    linkedIssues: Array<{ id: string; key: string; url: string }>;
  };
  linear?: {
    linkedIssueIDs: string[];
  };
  created: Date;
}

export interface IPostModel extends Model<IPostDocument> {}

const jiraIssueSchema = new Schema({
  id: String,
  key: String,
  url: String,
}, { _id: false });

const postSchema = new Schema<IPostDocument, IPostModel>({
  companyID: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  boardID: {
    type: Schema.Types.ObjectId,
    ref: 'Board',
    required: true,
    index: true,
  },
  authorID: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  byID: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  categoryID: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    index: true,
  },
  ownerID: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  details: {
    type: String,
    default: '',
    maxlength: 50000,
  },
  status: {
    type: String,
    enum: POST_STATUSES,
    default: 'open',
    index: true,
  },
  statusChangedAt: {
    type: Date,
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    index: true,
  },
  commentCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  eta: {
    type: String,
  },
  imageURLs: [{
    type: String,
  }],
  tagIDs: [{
    type: Schema.Types.ObjectId,
    ref: 'Tag',
  }],
  jira: {
    linkedIssues: [jiraIssueSchema],
  },
  linear: {
    linkedIssueIDs: [String],
  },
  created: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Compound indexes for common queries
postSchema.index({ boardID: 1, created: -1 });
postSchema.index({ boardID: 1, score: -1 });
postSchema.index({ boardID: 1, status: 1, created: -1 });

// Text index for search
postSchema.index({ title: 'text', details: 'text' });

// Virtual for URL
postSchema.virtual('url').get(function() {
  return `/admin/post/${this._id}`;
});

// Transform output to API format
postSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.companyID;
    delete ret.boardID; // Will be populated as 'board' object
    delete ret.authorID; // Will be populated as 'author' object
    delete ret.byID;
    delete ret.categoryID;
    delete ret.ownerID;
    delete ret.tagIDs;
    ret.created = ret.created?.toISOString();
    ret.statusChangedAt = ret.statusChangedAt?.toISOString();
    return ret;
  },
});

export const Post = mongoose.model<IPostDocument, IPostModel>('Post', postSchema);
