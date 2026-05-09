import Link from "next/link";
import "./styles/layout.scss";

export default function LandingFooter() {
    return (
        <footer>
            <div>
                <h2>Stash</h2>
                <p>Digital dollar banking that feels calm, clear, and beautifully simple.</p>
            </div>
            <div>
                <h2>Product</h2>
                <Link href="/dashboard/overview">Dashboard</Link>
                <Link href="/dashboard/flexible">Flexible Savings</Link>
            </div>
            <div>
                <h2>Legal</h2>
                <Link href="#">Terms of Service</Link>
                <Link href="#">Privacy Policy</Link>
            </div>
            <div>
                <h2>Social</h2>
                <Link href="#">Twitter / X</Link>
                <Link href="#">Discord</Link>
            </div>
        </footer>
    );
}
