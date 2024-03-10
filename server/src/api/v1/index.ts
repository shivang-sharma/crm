import { Router } from "express";

import { ApiV1AuthRouter } from "./auth/AuthRouter";
import { ApiV1ContactsRouter } from "./contacts/ContactsRouter";
import { ApiV1DealsRouter } from "./deals/DealsRouter";
import { ApiV1LeadsRouter } from "./leads/LeadsRouter";
import { ApiV1UsersRouter } from "./users/UsersRouter";
import { ApiV1AccountsRouter } from "./accounts/AccountsRouter";
import { ApiV1OrganisationsRouter } from "./organisations/OrganisationsRouter";
import { authenticate } from "@/middlewares/AuthMiddleware";
import { asyncHandler } from "@/utils/AsyncHandler";

export const ApiV1Router = Router();

ApiV1Router.use("/auth", ApiV1AuthRouter);

ApiV1Router.use(asyncHandler(authenticate));
// Below routes required authentication
ApiV1Router.use("/accounts", ApiV1AccountsRouter);
ApiV1Router.use("/contacts", ApiV1ContactsRouter);
ApiV1Router.use("/deals", ApiV1DealsRouter);
ApiV1Router.use("/leads", ApiV1LeadsRouter);
ApiV1Router.use("/organisations", ApiV1OrganisationsRouter);
ApiV1Router.use("/users", ApiV1UsersRouter);
