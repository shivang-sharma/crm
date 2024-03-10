import { Router } from "express";
import { OrganisationsService } from "./service/OrganisationsService";
import { OrganisationsController } from "./controller/OrganisationsController";
import { asyncHandler } from "@/utils/AsyncHandler";

const router = Router();
const organisationsService: OrganisationsService = new OrganisationsService();
const organisationsController: OrganisationsController =
    new OrganisationsController(organisationsService);

router.post("/", asyncHandler(organisationsController.CreateOrganisation));
router.get(
    "/:organisationId",
    asyncHandler(organisationsController.GetOneOrganisation)
);
router.patch(
    "/:organisationId/change_owner",
    asyncHandler(organisationsController.ChangeOwner)
);
router.delete(
    "/:organisationId",
    asyncHandler(organisationsController.DeleteOrganisation)
);
export { router as ApiV1OrganisationsRouter };
