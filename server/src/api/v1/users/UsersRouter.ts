import { Router } from "express";
import { UsersService } from "./service/UsersService";
import { UsersController } from "./controller/UsersController";
import { asyncHandler } from "@/utils/AsyncHandler";

const router = Router();
const usersService: UsersService = new UsersService();
const usersController: UsersController = new UsersController(usersService);

router.get("/", asyncHandler(usersController.GetAllUsers));
router.get("/:userId", asyncHandler(usersController.GetOneUser));
router.patch("/:userId/change_role", asyncHandler(usersController.ChangeRole));
router.patch(
    "/:userId/remove_from_org",
    asyncHandler(usersController.RemoveFromOrganisation)
);
router.patch("/:userId", asyncHandler(usersController.UpdateUser));
router.delete("/:userId", asyncHandler(usersController.DeleteUser));

export { router as ApiV1UsersRouter };
