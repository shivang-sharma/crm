import { Router } from "express";
import { LeadsService } from "./service/LeadsService";
import { LeadsController } from "./controller/LeadsController";
import { asyncHandler } from "@/utils/AsyncHandler";

const router = Router();
const leadsService: LeadsService = new LeadsService();
const leadsController: LeadsController = new LeadsController(leadsService);

router.post("/", asyncHandler(leadsController.CreateLead));
router.post(
    "/:leadId/move_to_contacts",
    asyncHandler(leadsController.MoveToContact)
);
router.get("/", asyncHandler(leadsController.GetAllLeads));
router.get("/:leadId", asyncHandler(leadsController.GetOneLead));
router.patch(
    "/:leadId/change_status",
    asyncHandler(leadsController.ChangeStatus)
);
router.patch("/:leadId", asyncHandler(leadsController.UpdateLead));
router.delete("/:leadId", asyncHandler(leadsController.DeleteLead));

export { router as ApiV1LeadsRouter };
