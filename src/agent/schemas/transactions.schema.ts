import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Transaction extends Document {
    @Prop({ required: true })
    agent: string;
    @Prop({ required: true })
    from: string;
    @Prop({ required: true })
    to: string;
    @Prop({ required: true })
    amount: string;
    @Prop({ required: true })
    token: string;
    @Prop({ required: true })
    transactionHash: string;
    @Prop({ required: true })
    blockNumber: string;
    @Prop({ required: true })
    timestamp: string;
    @Prop({ required: true })
    type: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);



