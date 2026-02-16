import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IBoardDocument extends Document {
  _id: mongoose.Types.ObjectId;
  companyID: mongoose.Types.ObjectId;
  name: string;
  url: string; // slug
  token: string;
  isPrivate: boolean;
  privateComments: boolean;
  postCount: number;
  statuses: string[]; // Available statuses for this board
  created: Date;
}

export interface IBoardModel extends Model<IBoardDocument> {}

const boardSchema = new Schema<IBoardDocument, IBoardModel>({
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
  url: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  token: {
    type: String,
    default: () => uuidv4(),
    unique: true,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  privateComments: {
    type: Boolean,
    default: false,
  },
  postCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  statuses: {
    type: [String],
    default: ['open', 'planned', 'in progress', 'complete'],
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index: url (slug) must be unique per company
boardSchema.index({ companyID: 1, url: 1 }, { unique: true });

// Pre-save: generate URL slug from name if not provided
boardSchema.pre('save', function(next) {
  if (!this.url || this.isModified('name')) {
    this.url = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Transform output to match Canny API format
boardSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.companyID;
    ret.created = ret.created?.toISOString();
    return ret;
  },
});

export const Board = mongoose.model<IBoardDocument, IBoardModel>('Board', boardSchema);
