
const User = require("../models/signUpModel");
const path = require("path");
const { createOrder, getOrderStatus } = require("../services/cashfreeService");


// PAYMENT PAGE - GET
const getPaymentPage = async (req, res) => {

    try {

        return res.sendFile(
            path.join(__dirname, "../../Frontend/paymentPage/payment.html")
        );

    } catch (error) {

        console.error("Error loading payment page:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load payment page"
        });
    }
};


// CREATE CASHFREE PAYMENT ORDER POST

const processPayment = async (req, res) => {

    try {

        const {amount, customerName, customerEmail, customerPhone} = req.body;

        // BASIC VALIDATION

        if (!amount || !customerName || !customerEmail || !customerPhone) {

            return res.status(400).json({
                success: false,
                message: "All payment details are required"
            });
        }


        // CALL SERVICE TO CREATE ORDER
        const result = await createOrder(amount, customerName, customerEmail, customerPhone);


        if (result.success) {

            return res.status(200).json({

                success: true,

                orderId: result.orderId,

                paymentSessionId: result.paymentSessionId
            });

        } else {

            return res.status(500).json({

                success: false,

                message: result.message,

                error: result.error
            });
        }


    } catch (error) {

        console.error("Process Payment Error:");

        console.error(error.message);


        return res.status(500).json({

            success: false,

            message: "Unable to process payment",

            error: error.message
        });
    }
};


// CHECK PAYMENT STATUS

const getPaymentStatus = async (req, res) => {

    try {

        const { orderId } = req.params;

        // VALIDATE ORDER ID
        if (!orderId) {

            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });
        }


        // CALL SERVICE TO GET ORDER STATUS
        const result = await getOrderStatus(orderId);


        if (!result.success) {

            return res.status(500).json({

                success: false,
                message: result.message,
                error: result.error
            });
        }


        const orderStatus = result.orderStatus;


        // PAYMENT SUCCESS
        if (orderStatus === "PAID") {


            // GET LOGGED-IN USER

            const user = await User.findOne({

                where: {
                    email: req.user.email
                }

            });


            if (!user) {

                return res.status(404).json({

                    success: false,
                    message: "User not found"
                });
            }


            // MAKE USER PREMIUM
            if (!user.isPremium) {

                user.isPremium = true;

                await user.save();

                console.log(`User ${user.email} is now Premium`);
            }


            // SUCCESS RESPONSE
            return res.status(200).json({

                success: true,
                message: "Payment successful. User is now Premium.",
                isPremium: true,
                order: result.order
            });
        }


        // PAYMENT NOT SUCCESSFUL

        return res.status(200).json({

            success: false,

            message: "Payment is not completed",

            isPremium: false,

            orderStatus: orderStatus,

            order: result.order
        });


    } catch (error) {

        console.error("Fetch Order Error:");

        console.error(error.message);


        return res.status(500).json({

            success: false,
            message: "Unable to fetch order",
            error: error.message
        });
    }
};

// PAYMENT SUCCESS PAGE GET

const getPaymentSuccess = async (req, res) => {

    try {

        const { order_id } = req.query;
        console.log("Payment success page for order:", order_id);


        return res.sendFile(
            path.join(__dirname, "../../Frontend/paymentPage/paymentSuccess.html")
        );


    } catch (error) {

        console.error("Error loading payment success page:",error);


        return res.status(500).send("Unable to open payment success page");
    }
};


// EXPORT


module.exports = {

    getPaymentPage,

    processPayment,

    getPaymentStatus,

    getPaymentSuccess

};

