import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ArtisanSignup from "./components/ArtisanSignup";
import BuyerSignup from "./components/BuyerSignup";
import Login from "./components/Login";
import SelectRole from "./components/SelectRole";
import SplashScreen from "./components/SplashScreen";
import ArtisanDashboard from "./components/ArtisanDashboard";
import BuyerDashboard from "./components/BuyerDashboard/BuyerDashboard";
import AboutUs from "./components/BuyerDashboard/AboutUs";
import WaitingVerification from "./components/WaitingVerification";
import BuyerProfile from "./components/BuyerProfile";
import AddProduct from "./components/ArtisanDashboardd/AddProduct";
import ProductDetails from "./components/BuyerDashboard/ProductDetails";
import MyProducts from "./components/ArtisanDashboardd/Myproducts";
import Checkout from "./components/BuyerDashboard/Checkout";
import OrderSuccess from "./components/BuyerDashboard/OrderSuccess";
import ArtisanOrders from "./components/ArtisanDashboardd/Artisanorders";
import CartCheckout from "./components/BuyerDashboard/Cartcheckout";         
import CartOrderSuccess from "./components/BuyerDashboard/Cartordersuccess";
import AdminPanel from "./AdminPanel";
import MyOrders from "./components/BuyerDashboard/MyOrders";
import AIRecommendation from "./components/BuyerDashboard/AIRecommendation";
import ArtisanProfile from "./components/ArtisanDashboardd/Artisanprofile"
import CraftelligenceChatbot from "./components/BuyerDashboard/CraftelligenceChatbot";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"                   element={<SplashScreen />} />
        <Route path="/selectrole"         element={<SelectRole />} />
        <Route path="/artisan-signup"     element={<ArtisanSignup />} />
        <Route path="/buyer-signup"       element={<BuyerSignup />} />
        <Route path="/login"              element={<Login />} />
        <Route path="/artisan-dashboard"  element={<ArtisanDashboard />} />
        <Route path="/buyer-dashboard"    element={<BuyerDashboard />} />
        <Route path="/about"              element={<AboutUs />} />
        <Route path="/waiting-verification" element={<WaitingVerification />} />
        <Route path="/buyer-profile"      element={<BuyerProfile />} />
        <Route path="/add-product"        element={<AddProduct />} />
        <Route path="/my-products"        element={<MyProducts />} />
        <Route path="/product/:id"        element={<ProductDetails />} />
        <Route path="/checkout"           element={<Checkout />} />
        <Route path="/order-success"      element={<OrderSuccess />} />
        <Route path="/artisan-orders"     element={<ArtisanOrders />} />
        <Route path="/cart-checkout"      element={<CartCheckout />} />      
        <Route path="/cart-order-success" element={<CartOrderSuccess />} />   
        <Route path="/admin"              element={<AdminPanel />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/ai-design" element={<AIRecommendation />} />
        <Route path="/artisan-profile" element={<ArtisanProfile />} />
        <Route path="/Chatbot" element={<CraftelligenceChatbot />} />
        
      </Routes>
      <CraftelligenceChatbot apiBase="http://localhost:8000" />
    </Router>
  );
}

export default App;