import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Container } from '../ui/misc';
import { Logo } from './Header';
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF } from '../../data/constants';

export function Footer() {
  return (
    <footer className="no-print mt-auto bg-brand-950 text-brand-200">
      <Container className="py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-300">
              Promotional spaces and mobile promotions inside Garki Market, Abuja — managed by AICL.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-white">Explore</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link className="hover:text-white" to="/plan">Plan Your Promotion</Link></li>
              <li><Link className="hover:text-white" to="/plan?type=mobile">Mobile Promotion</Link></li>
              <li><Link className="hover:text-white" to="/my-bookings">My Bookings</Link></li>
              <li><Link className="hover:text-white" to="/gate-scan">Gate Scan</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-white">AICL</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link className="hover:text-white" to="/admin">Admin Approvals</Link></li>
              <li>Promotional guidelines</li>
              <li>Terms of use</li>
              <li>Privacy</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-white">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" /> Market Management Office, Garki Market, Area 10, Abuja</li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white">{CONTACT_EMAIL}</a>
              </li>
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                <a href={CONTACT_PHONE_HREF} className="hover:text-white">{CONTACT_PHONE}</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-brand-300 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} AICL. Interactive prototype — all data, brands and figures are dummy content.</p>
          <p>
            Photos: Garki &amp; Abuja market images from Wikimedia Commons (CC BY-SA 4.0 — Anass Sedrati, Kritzolina,
            EsthyR, Tenisnaps, ShoT88 Studios); activation images from Unsplash.
          </p>
        </div>
      </Container>
    </footer>
  );
}
