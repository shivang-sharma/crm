import { Router } from "express";
import { AuthService } from "./service/AuthService";
import { AuthController } from "./controller/AuthController";
import { asyncHandler } from "@/utils/AsyncHandler";
import { authenticate } from "@/middlewares/AuthMiddleware";

const router = Router();
const authService: AuthService = new AuthService();
const authController: AuthController = new AuthController(authService);

router.post("/signup", asyncHandler(authController.SignUp));
router.post("/login", asyncHandler(authController.Login));
router.post(
    "/logout",
    asyncHandler(authenticate),
    asyncHandler(authController.Logout)
);

export { router as ApiV1AuthRouter };
