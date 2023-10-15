import { IUser } from '../../interfaces/user.interface';
import UserModel from '../models/user.model';

class UserDao {
  async getUserByUsername(emailOrUsername: string): Promise<IUser | null> {
    return await UserModel.findOne({ username: emailOrUsername }).lean();
  }

  async getUserByEmail(emailOrUsername: string): Promise<IUser | null> {
    return await UserModel.findOne({ email: emailOrUsername }).lean();
  }

  async getUserById(userId: string): Promise<IUser | null> {
    return await UserModel.findById(userId).lean();
  }

  async listUsers(query: any = {}, skip: number = 0, limit: number = 100, sort: any = {}): Promise<IUser[]> {
    return await UserModel.find(query).skip(skip).limit(limit).sort(sort).lean();
  }

  async create(user: IUser): Promise<IUser> {
    return await UserModel.create(user);
  }

  async update(userId: string, user: IUser): Promise<IUser | null> {
    console.log(user);
    return await UserModel.findByIdAndUpdate(userId, user, { new: true }).lean();
  }

  async delete(userId: string): Promise<IUser | null> {
    return await UserModel.findByIdAndDelete(userId).lean();
  }
}

export default UserDao;
