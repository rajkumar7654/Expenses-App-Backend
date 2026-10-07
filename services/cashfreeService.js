const { Cashfree, CFEnvironment } = require("cashfree-pg");


// CASHFREE CONFIGURATION
const cashfree = new Cashfree(
    CFEnvironment.SANDBOX,
    process.env.CASHFREE_CLIENT_ID,
    process.env.CASHFREE_CLIENT_SECRET
);


// CREATE CASHFREE PAYMENT ORDER
const createOrder = async (amount, customerName, customerEmail, customerPhone) => {

    try {

        // GENERATE UNIQUE ORDER ID
        const orderId = "expense_" + Date.now() + "_" + Math.floor(Math.random() * 10000);


        // CASHFREE ORDER REQUEST
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

                return_url: `http://localhost:3000/payment/success?order_id=${orderId}`
            }
        };


        console.log("Creating Cashfree order...");
        console.log(request);


        // CREATE ORDER IN CASHFREE
        const response = await cashfree.PGCreateOrder(request);


        console.log("Cashfree response:");
        console.log(response.data);


        return {
            success: true,
            orderId: orderId,
            paymentSessionId: response.data.payment_session_id
        };


    } catch (error) {

        console.error("Cashfree Create Order Error:");

        console.error(error.response?.data || error.message || error);


        return {
            success: false,
            message: "Unable to create Cashfree order",
            error: error.response?.data || error.message
        };
    }
};


// CHECK PAYMENT STATUS
const getOrderStatus = async (orderId) => {

    try {

        // FETCH ORDER FROM CASHFREE
        const response = await cashfree.PGFetchOrder(orderId);

        console.log("Order status:");
        console.log(response.data);

        const orderStatus = response.data.order_status;

        console.log("Cashfree Order Status:", orderStatus);


        return {
            success: true,
            orderStatus: orderStatus,
            order: response.data
        };


    } catch (error) {

        console.error("Fetch Order Error:");

        console.error(error.response?.data || error.message || error);


        return {
            success: false,
            message: "Unable to fetch order",
            error: error.response?.data || error.message
        };
    }
};


module.exports = {
    createOrder,
    getOrderStatus
};
