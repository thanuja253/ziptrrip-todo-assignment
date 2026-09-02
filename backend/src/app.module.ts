import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { config as loadEnv } from 'dotenv';
import { TodosModule } from './todos/todos.module';

loadEnv();

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/ziptrrip',
    ),
    TodosModule,
  ],
})
export class AppModule {}
