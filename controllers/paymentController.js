
const { Cashfree, CFEnvironment } = require("cashfree-pg");
const User = require("../models/signUpModel");
const path = require("path");


// ===============================
// CASHFREE CONFIGURATION
// ===============================

const cashfree = new Cashfree(
    CFEnvironment.SANDBOX,
    process.env.CASHFREE_CLIENT_ID,
    process.env.CASHFREE_CLIENT_SECRET
);


// ===============================
// PAYMENT PAGE - GET
// ===============================

const getPaymentPage = async (req, res) => {

    try {

        return res.sendFile(
            path.join(
                __dirname,
                "../../Frontend/paymentPage/payment.html"
            )
        );

    } catch (error) {

        console.error("Error loading payment page:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load payment page"
        });
    }
};


// ===============================
// CREATE CASHFREE PAYMENT ORDER
// POST
// ===============================

const processPayment = async (req, res) => {

    try {

        const {
            amount,
            customerName,
            customerEmail,
            customerPhone
        } = req.body;


        // ===============================
        // BASIC VALIDATION
        // ===============================

        if (
            !amount ||
            !customerName ||
            !customerEmail ||
            !customerPhone
        ) {

            return res.status(400).json({
                success: false,
                message: "All payment details are required"
            });
        }


        // ===============================
        // GENERATE UNIQUE ORDER ID
        // ===============================

        const orderId =
            "expense_" +
            Date.now() +
            "_" +
            Math.floor(Math.random() * 10000);


        // ===============================
        // CASHFREE ORDER REQUEST
        // ===============================

        const request = {

            order_amount: Number(amount),

            order_currency: "INR",

            order_id: orderId,

            customer_details: {

                customer_id:
                    "customer_" + Date.now(),

                customer_name:
                    customerName,

                customer_email:
                    customerEmail,

                customer_phone:
                    customerPhone
            },

            order_meta: {

                return_url:
                    `http://localhost:3000/payment/success?order_id=${orderId}`
            }
        };


        console.log("Creating Cashfree order...");
        console.log(request);


        // ===============================
        // CREATE ORDER IN CASHFREE
        // ===============================

        const response =
            await cashfree.PGCreateOrder(request);


        console.log("Cashfree response:");
        console.log(response.data);


        // ===============================
        // SEND RESPONSE
        // ===============================

        return res.status(200).json({

            success: true,

            orderId: orderId,

            paymentSessionId:
                response.data.payment_session_id
        });


    } catch (error) {

        console.error("Cashfree Create Order Error:");

        console.error(
            error.response?.data ||
            error.message ||
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to create Cashfree order",

            error:
                error.response?.data ||
                error.message
        });
    }
};


// ===============================
// CHECK PAYMENT STATUS
// GET
// ===============================

const getPaymentStatus = async (req, res) => {

    try {

        const { orderId } = req.params;


        // ===============================
        // VALIDATE ORDER ID
        // ===============================

        if (!orderId) {

            return res.status(400).json({

                success: false,

                message:
                    "Order ID is required"
            });
        }


        // ===============================
        // FETCH ORDER FROM CASHFREE
        // ===============================

        const response =
            await cashfree.PGFetchOrder(orderId);


        console.log("Order status:");
        console.log(response.data);


        const orderStatus =
            response.data.order_status;


        console.log(
            "Cashfree Order Status:",
            orderStatus
        );


        // ===============================
        // PAYMENT SUCCESS
        // ===============================

        if (orderStatus === "PAID") {


            // ===============================
            // GET LOGGED-IN USER
            // ===============================

            const user =
                await User.findOne({

                    where: {
                        email: req.user.email
                    }

                });


            if (!user) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User not found"
                });
            }


            // ===============================
            // MAKE USER PREMIUM
            // ===============================

            if (!user.isPremium) {

                user.isPremium = true;

                await user.save();


                console.log(
                    `User ${user.email} is now Premium`
                );
            }


            // ===============================
            // SUCCESS RESPONSE
            // ===============================

            return res.status(200).json({

                success: true,

                message:
                    "Payment successful. User is now Premium.",

                isPremium: true,

                order: response.data
            });
        }


        // ===============================
        // PAYMENT NOT SUCCESSFUL
        // ===============================

        return res.status(200).json({

            success: false,

            message:
                "Payment is not completed",

            isPremium: false,

            orderStatus:
                orderStatus,

            order:
                response.data
        });


    } catch (error) {

        console.error("Fetch Order Error:");

        console.error(
            error.response?.data ||
            error.message ||
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch order",

            error:
                error.response?.data ||
                error.message
        });
    }
};


// ===============================
// PAYMENT SUCCESS PAGE
// GET
// ===============================

const getPaymentSuccess = async (req, res) => {

    try {

        const { order_id } = req.query;


        console.log(
            "Payment success page for order:",
            order_id
        );


        return res.sendFile(

            path.join(
                __dirname,
                "../../Frontend/paymentPage/paymentSuccess.html"
            )

        );


    } catch (error) {

        console.error(
            "Error loading payment success page:",
            error
        );


        return res.status(500).send(
            "Unable to open payment success page"
        );
    }
};


// ===============================
// EXPORT
// ===============================

module.exports = {

    getPaymentPage,

    processPayment,

    getPaymentStatus,

    getPaymentSuccess

};

