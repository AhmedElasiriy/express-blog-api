import bcrypt from 'bcrypt';
import fs from 'fs';
import { autoInjectable } from 'tsyringe';

import UserDao from '../DB/dao/user.dao';
import HttpException from '../exceptions/HttpException';
import { IPagination } from '../interfaces/respons.interface';
import { IUser } from '../interfaces/user.interface';
import APIFeatures from '../utils/apiFeatures';
import { cloudinaryDeleteImage, cloudinaryUploadImage } from '../utils/cloudinary';

@autoInjectable()
class UserService {
  constructor(private userDao: UserDao) {}

  async getUsers(reqQuery: any): Promise<{
    users: IUser[] | null;
    paginate: IPagination;
  }> {
    let apiFeatures = new APIFeatures(reqQuery);
    let query = apiFeatures.filter();
    let paginate = apiFeatures.paginate();
    let sort = apiFeatures.sort();
    let fields = apiFeatures.selectFields();
    // search by keyword
    // if (reqQuery.keyword) {
    //   query = { ...query, bio: { $regex: reqQuery.keyword, $options: 'i' } };
    // }

    let users = await this.userDao.listUsers(query, paginate, sort, fields);
    if (users) paginate = apiFeatures.paginate(users.length); // update the pagination object with the total documents

    return { users, paginate };
  }

  async getUser(userId: string) {
    return await this.userDao.getUserById(userId);
  }

  async createUser(user: IUser) {
    // check if the user already exists
    let isEmailExists = await this.userDao.getUserByEmail(user.email);
    let isUsernameExists = await this.userDao.getUserByUsername(user.username);

    if (isEmailExists) {
      throw new HttpException(409, `E-Mail address ${user.email} is already exists, please pick a different one.`);
    } else if (isUsernameExists) {
      throw new HttpException(409, 'Username already in use');
    }

    // hash the password
    user.password = await bcrypt.hash(user.password, 10);

    let newUser = await this.userDao.create(user);

    return newUser;
  }

  async updateUser(userId: string, user: IUser) {
    let isUserExists = await this.userDao.getUserById(userId);
    if (!isUserExists) throw new HttpException(404, 'No user found');
    return await this.userDao.update(userId, user);
  }

  async deleteUser(userId: string) {
    let isUserExists = await this.userDao.getUserById(userId);
    if (!isUserExists) throw new HttpException(404, 'No user found');
    // TODO: delete all the posts and comments that belong to this user
    return await this.userDao.delete(userId);
  }

  async updateProfileImage(userId: string, file: Express.Multer.File) {
    const filePath = `${file.path}`;
    const result = await cloudinaryUploadImage(filePath);
    // update the user with the image url and public id
    let user = await this.userDao.getUserById(userId);
    if (!user) throw new HttpException(404, 'No user found');
    // delete the old image from cloudinary if exists
    if (user.profilePicture.publicId) await cloudinaryDeleteImage(user.profilePicture.publicId);
    // Change the profilePhoto field in the DB
    user = await this.userDao.update(userId, { profilePicture: { url: result.secure_url, publicId: result.public_id } } as IUser);

    // remove the file from the server
    fs.unlinkSync(filePath);
    return user;
  }

  async getFollowing(userId: string) {
    let following = await this.userDao.getFollowing(userId);
    return following;
  }

  async getFollowers(userId: string) {
    let followers = await this.userDao.getFollowers(userId);
    return followers;
  }

  async followUser(userId: string, userToFollowId: string) {
    let isUserExists = await this.userDao.getUserById(userToFollowId);
    if (!isUserExists) throw new HttpException(404, `There is no user with id ${userToFollowId}`);

    // add userToFollowId to the following array of userId
    let user = await this.userDao.addToFollowing(userId, userToFollowId);
    // add userId to the followers array of userToFollowId
    await this.userDao.addToFollowers(userToFollowId, userId);

    return user;
  }

  async unfollowUser(userId: string, userToUnfollowId: string) {
    let isUserExists = await this.userDao.getUserById(userToUnfollowId);
    if (!isUserExists) throw new HttpException(404, `There is no user with id ${userToUnfollowId}`);

    // remove userToUnfollowId from the following array of userId
    let user = await this.userDao.removeFromFollowing(userId, userToUnfollowId);
    // remove userId from the followers array of userToUnfollowId
    await this.userDao.removeFromFollowers(userToUnfollowId, userId);
    return user;
  }
}

export { UserService };
