import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Attach global event listeners for connection lifecycle
    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected successfully.");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err.message);
    });
  } catch (error) {
    console.error("MongoDB initial connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
