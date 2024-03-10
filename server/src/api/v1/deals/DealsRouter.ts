import { Router } from "express";
import { DealsService } from "./service/DealsService";
import { DealsController } from "./controller/DealsController";
import { asyncHandler } from "@/utils/AsyncHandler";

const router = Router();
const dealsService: DealsService = new DealsService();
const dealsController: DealsController = new DealsController(dealsService);

router.post("/", asyncHandler(dealsController.CreateDeal));
router.get("/", asyncHandler(dealsController.GetAllDeals));
router.get("/:dealId", asyncHandler(dealsController.GetOneDeal));
router.patch("/:dealId", asyncHandler(dealsController.UpdateDeal));
router.delete("/:dealId", asyncHandler(dealsController.DeleteDeal));

export { router as ApiV1DealsRouter };
