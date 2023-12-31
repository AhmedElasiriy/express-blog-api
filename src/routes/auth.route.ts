import { Router } from 'express';
import { autoInjectable } from 'tsyringe';

import { AuthController } from '../controllers/auth.controller';
import { Routes } from '../interfaces/routes.interface';
import { loginValidator, signupValidator } from '../middleware/validation';

@autoInjectable()
export class AuthRoute implements Routes {
  public path = '/auth';
  public router = Router();

  constructor(private readonly authController: AuthController) {
    this.initializerRoutes();
  }

  private initializerRoutes() {
    this.router.post(`${this.path}/signup`, signupValidator, this.authController.signup);
    this.router.post(`${this.path}/login`, loginValidator, this.authController.login);
  }
}
