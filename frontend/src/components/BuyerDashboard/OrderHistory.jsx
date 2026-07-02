import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

function OrderHistory() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const email = localStorage.getItem("email");

    axios.get(`http://127.0.0.1:8000/api/orders/${email}/`)
      .then(res => setOrders(res.data));
  }, []);

  return (
    <div>
      <h2>{t("my_orders_title", "My Orders")}</h2>
      {orders.map(order => (
        <div key={order.id}>
          <p>{t("order_id_col", "Order ID")}: {order.id}</p>
          <p>{t("mo_total", "Total")}: ₹{order.total_amount}</p>
          <p>{t("mo_item_status", "Status")}: {t(`status_${order.payment_status.toLowerCase()}`, order.payment_status)}</p>
        </div>
      ))}
    </div>
  );
}

export default OrderHistory;