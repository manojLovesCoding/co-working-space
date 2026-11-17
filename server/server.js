import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";

import authRouter from "./routes/authRoutes.js";
import propertyRouter from "./routes/propertyRoutes.js";
import connectCloudinary from "./config/cloudinary.js";
import paymentRouter from "./routes/paymentRoutes.js";
import dns from "dns";
import spaceRouter from "./routes/spaceRoutes.js";
import profileRouter2 from "./routes/profileRoutes2.js";
import companyRouter from "./routes/companyRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import visitorRouter from "./routes/Visitorroutes.js";
import couponRouter from "./routes/couponRoutes.js";
import teamRouter from "./routes/teamRoutes.js";
import invoiceRouter from "./routes/invoiceRoutes.js";
import virtualOfficePriceRouter from "./routes/virtualOfficePriceRoutes.js";

const app = express();
const PORT = process.env.PORT || 4000;

dns.setServers(["1.1.1.1", "8.8.8.8"]);

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.get("/", (req, res) => res.send("server is running"));

app.use("/api/auth", authRouter);
app.use("/api/property", propertyRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/space", spaceRouter);
app.use("/api/profile", profileRouter2);
app.use("/api/company", companyRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/visitor", visitorRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/team", teamRouter);
app.use("/api/invoice", invoiceRouter);
app.use("/api/virtual-office-price", virtualOfficePriceRouter);

await connectDB();
connectCloudinary();

app.listen(PORT, () => console.log(`server running on port ${PORT}`));
