import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVoteDocument extends Document {
  _id: mongoose.Types.ObjectId;
  companyID: mongoose.Types.ObjectId;
  postID: mongoose.Types.ObjectId;
  voterID: mongoose.Types.ObjectId;
  byID?: mongoose.Types.ObjectId;
  votePriority?: string;
  created: Date;
}

export interface IVoteModel extends Model<IVoteDocument> {}

const voteSchema = new Schema<IVoteDocument, IVoteModel>({
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
  voterID: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  byID: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  votePriority: {
    type: String,
    default: 'No priority',
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

// Enforce unique vote per user per post
voteSchema.index({ postID: 1, voterID: 1 }, { unique: true });

// Transform output to match Canny API format
voteSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.companyID;
    delete ret.postID; // Will be populated as 'post' object
    delete ret.voterID; // Will be populated as 'voter' object
    delete ret.byID;
    ret.created = ret.created?.toISOString();
    return ret;
  },
});

export const Vote = mongoose.model<IVoteDocument, IVoteModel>('Vote', voteSchema);
