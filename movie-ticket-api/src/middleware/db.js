import mongoose from "mongoose";

// Biến này nằm ngoài hàm để nó được lưu lại trong RAM của Vercel (Warm Start)
let isConnected = false;

const connect = async () => {
    if (isConnected) {
        // Nếu đã kết nối rồi thì return ngay, không đợi thêm 1ms nào nữa
        return;
    }

    try {
        const db = await mongoose.connect(process.env.MONGO_DB, {            
            bufferCommands: false, 
        });

        isConnected = db.connections[0].readyState;

        console.log("=> Đã thiết lập kết nối MongoDB mới");
    } catch (error) {
        console.error("=> Lỗi kết nối MongoDB:", error);
        throw error;
    }
};

const dbMiddleware = async (req, res, next) => {
    try {
        await connect();
        next();
    } catch (error) {        
        res.status(500).json({ 
            message: "Database connection failed", 
            error: error.message 
        });
    }
};

export default dbMiddleware;