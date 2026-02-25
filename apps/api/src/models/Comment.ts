import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommentDocument extends Document {
  _id: mongoose.Types.ObjectId;
  companyID: mongoose.Types.ObjectId;
  postID: mongoose.Types.ObjectId;
  authorID: mongoose.Types.ObjectId;
  byID?: mongoose.Types.ObjectId;
  parentID?: mongoose.Types.ObjectId;
  value: string;
  imageURLs: string[];
  internal: boolean;
  private: boolean;
  likeCount: number;
  reactions?: {
    like?: number;
  };
  mentions: mongoose.Types.ObjectId[];
  created: Date;
}

export interface ICommentModel extends Model<ICommentDocument> {}

const commentSchema = new Schema<ICommentDocument, ICommentModel>({
  companyID: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  postID: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
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
  parentID: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    index: true,
  },
  value: {
    type: String,
    required: true,
    maxlength: 10000,
  },
  imageURLs: [{
    type: String,
  }],
  internal: {
    type: Boolean,
    default: false,
  },
  private: {
    type: Boolean,
    default: false,
  },
  likeCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  reactions: {
    like: { type: Number, default: 0 },
  },
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  created: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Compound indexes
commentSchema.index({ postID: 1, created: -1 });

// Transform output to API format
commentSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.companyID;
    delete ret.postID; // Will be populated as 'post' partial
    delete ret.authorID; // Will be populated as 'author' object
    delete ret.byID;
    ret.parentID = ret.parentID?.toString() || null;
    ret.created = ret.created?.toISOString();
    return ret;
  },
});

export const Comment = mongoose.model<ICommentDocument, ICommentModel>('Comment', commentSchema);
