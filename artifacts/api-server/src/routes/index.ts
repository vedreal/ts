import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import walletRouter from "./wallet";
import transactionsRouter from "./transactions";
import tasksRouter from "./tasks";
import referralsRouter from "./referrals";
import setupRouter from "./setup";

const router: IRouter = Router();

// Middleware to extract telegram ID from header for all routes
router.use((req, res, next) => {
  // Allow registration without telegram ID
  if (req.path === "/users/register" && req.method === "POST") {
    return next();
  }
  next();
});

router.use(healthRouter);
router.use("/users", usersRouter);
router.use("/wallet", walletRouter);
router.use("/ton", walletRouter);
router.use("/transactions", transactionsRouter);
router.use("/tasks", tasksRouter);
router.use("/referrals", referralsRouter);
router.use("/setup", setupRouter);

export default router;
