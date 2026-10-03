const { Cashfree, CFEnvironment } = require("cashfree-pg");
const User = require("../models/signUpModel");
const path = require("path");

const cashfree = new Cashfree(
    CFEnvironment.SANDBOX,
    process.env.CASHFREE_CLIENT_ID,
    process.env.CASHFREE_CLIENT_SECRET
);


// PAYMENT PAGE
const getPaymentPage = (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "../../Frontend/paymentPage/payment.html"
        )
    );

};


// ===============================
// CREATE CASHFREE PAYMENT ORDER
// ===============================

const processPayment = async (req, res) => {

    try {

        const {
            amount,
            customerName,
            customerEmail,
            customerPhone
        } = req.body;


        // Basic validation
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


        // Generate unique order ID
        const orderId =
            "expense_" +
            Date.now() +
            "_" +
            Math.floor(Math.random() * 10000);


        const request = {

            order_amount: Number(amount),

            order_currency: "INR",

            order_id: orderId,


            customer_details: {

                customer_id: "customer_" + Date.now(),

                customer_name: customerName,

                customer_email: customerEmail,

                customer_phone: customerPhone

            },


            order_meta: {

                return_url:
                    `http://localhost:3000/payment/success?order_id=${orderId}`

            }

        };


        console.log("Creating Cashfree order...");

        console.log(request);


        // Create order in Cashfree
        const response =
            await cashfree.PGCreateOrder(request);


        console.log("Cashfree response:");

        console.log(response.data);



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

            message: "Unable to create Cashfree order",

            error:
                error.response?.data ||
                error.message

        });

    }

};


// ===============================
// CHECK PAYMENT STATUS
// ===============================

const getPaymentStatus = async (req, res) => {

    try {

        const orderId = req.params.orderId;


        if (!orderId) {

            return res.status(400).json({

                success: false,

                message: "Order ID is required"

            });

        }


        // Fetch order from Cashfree
        const response =
            await cashfree.PGFetchOrder(orderId);


        console.log("Order status:");

        console.log(response.data);


        // Cashfree payment status
        const orderStatus =
            response.data.order_status;


        console.log(
            "Cashfree Order Status:",
            orderStatus
        );



        // PAYMENT SUCCESS


        if (orderStatus === "PAID") {


            // Get logged-in user
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


            // ===================================
            // MAKE USER PREMIUM
            // ===================================

            if (!user.isPremium) {

                user.isPremium = true;

                await user.save();

                console.log(
                    `User ${user.email} is now Premium`
                );

            }


            return res.status(200).json({

                success: true,

                message: "Payment successful. User is now Premium.",

                isPremium: true,

                order: response.data

            });

        }


        // ===================================
        // PAYMENT NOT SUCCESSFUL
        // ===================================

        return res.status(200).json({

            success: false,

            message: "Payment is not completed",

            isPremium: false,

            orderStatus: orderStatus,

            order: response.data

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

            message: "Unable to fetch order",

            error:
                error.response?.data ||
                error.message

        });

    }

};



// PAYMENT SUCCESS PAGE


const getPaymentSuccess = async (req, res) => {

    try {

        const orderId = req.query.order_id;


        console.log(
            "Payment success page for order:",
            orderId
        );


        res.sendFile(

            path.join(
                __dirname,
                "../../Frontend/paymentPage/paymentSuccess.html"
            )

        );

    } catch (error) {

        console.error(error);

        res.status(500).send(
            "Unable to open payment success page"
        );

    }

};



module.exports = {

    getPaymentPage,

    processPayment,

    getPaymentStatus,

    getPaymentSuccess

};