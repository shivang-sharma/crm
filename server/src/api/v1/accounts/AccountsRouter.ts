import { Router } from "express";
import { AccountsService } from "./service/AccountsService";
import { AccountsController } from "./controller/AccountsController";
import { asyncHandler } from "@/utils/AsyncHandler";

const router = Router();
const accountsService: AccountsService = new AccountsService();
const accountsController: AccountsController = new AccountsController(
    accountsService
);

router.post("/", asyncHandler(accountsController.CreateAccount));
router.get("/", asyncHandler(accountsController.GetAllAccount));
router.get("/:accountId", asyncHandler(accountsController.GetOneAccount));
router.patch("/:accountId", asyncHandler(accountsController.UpdateAccount));
router.delete("/:accountId", asyncHandler(accountsController.DeleteAccount));

export { router as ApiV1AccountsRouter };
