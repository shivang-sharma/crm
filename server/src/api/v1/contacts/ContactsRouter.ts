import { Router } from "express";
import { ContactsService } from "./service/ContactsService";
import { ContactsController } from "./controller/ContactsController";
import { asyncHandler } from "@/utils/AsyncHandler";

const router = Router();
const contactsService: ContactsService = new ContactsService();
const contactsController: ContactsController = new ContactsController(
    contactsService
);

router.post("/", asyncHandler(contactsController.CreateContact));
router.get("/", asyncHandler(contactsController.GetAllContacts));
router.get("/:contactId", asyncHandler(contactsController.GetOneContact));
router.patch("/:contactId", asyncHandler(contactsController.UpdateContact));
router.delete("/:contactId", asyncHandler(contactsController.DeleteContact));

export { router as ApiV1ContactsRouter };
