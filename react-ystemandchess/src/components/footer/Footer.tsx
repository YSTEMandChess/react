import { FaLinkedin, FaSquareInstagram, FaFacebook, FaSquareXTwitter } from "react-icons/fa6";

const Footer = () => {
  return (
    <footer className="w-full bg-light border-t-2 border-dark pt-10 pb-8">
      <div className="mx-auto px-6 md:px-12 lg:px-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Branding & Mission */}
          <div className="flex flex-col items-center lg:items-start">
            <h2 className="text-2xl font-bold tracking-tight text-dark">
              YSTEM<span className="text-primary">&CHESS</span>
            </h2>
            <p className="text-gray text-sm font-bold leading-relaxed text-center lg:text-left">
              Empowering Tomorrow's STEM Leaders
            </p>
          </div>

          {/* Contact Info */}
          <div className="flex flex-row flex-wrap gap-4 md:gap-8 justify-center">
            <a href="tel:+12089965071" className="group flex items-center gap-4 hover:translate-x-1 transition-transform">
              <div className="flex-shrink-0 w-10 h-10 bg-soft rounded-md flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-light transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold uppercase text-muted">Call Us</span>
                <span className="text-sm font-bold text-dark group-hover:text-primary transition-colors whitespace-nowrap"> +1 (208) 996-5071 </span>
              </div>
            </a>

            <a href="mailto:info@ystemandchess.com" className="group flex items-center gap-4 hover:translate-x-1 transition-transform">
              <div className="flex-shrink-0 w-10 h-10 bg-soft rounded-md flex items-center justify-center border border-primary/30 group-hover:bg-primary group-hover:text-light transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold uppercase text-muted">Email Us</span>
                <span className="text-sm font-bold text-dark group-hover:text-primary transition-colors whitespace-nowrap">info@ystemandchess.com</span>
              </div>
            </a>
          </div>

          {/* Socials */}
          <div className="flex flex-col items-center lg:items-end">
            <h3 className="text-sm font-bold uppercase text-gray mr-2.5">
              Stay Connected
            </h3>

            <div className="flex gap-1">
            <a 
              href="https://web.facebook.com/YSTEMandChess" 
              aria-label="Facebook" 
              className="p-2 hover:bg-soft rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {FaFacebook({ size: 26, color: '#1F1F1F' }) as any}
            </a>
            <a 
              href="https://www.instagram.com/stemwithstemy" 
              aria-label="Instagram" 
              className="p-2 hover:bg-soft rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {FaSquareInstagram({ size: 26, color: '#1F1F1F' }) as any}
            </a>
            <a 
              href="https://x.com/ystemandchess" 
              aria-label="Twitter" 
              className="p-2 hover:bg-soft rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {FaSquareXTwitter({ size: 26, color: '#1F1F1F' }) as any}
            </a>
            <a 
              href="https://www.linkedin.com/company/ystemandchessinc" 
              aria-label="LinkedIn" 
              className="p-2 hover:bg-soft rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {FaLinkedin({ size: 26, color: '#1F1F1F' }) as any}
            </a>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-borderLight flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-bold text-muted tracking-widest uppercase text-center md:text-left">
            © {new Date().getFullYear()} Y STEM AND CHESS INC. | Boise, Idaho
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-primary uppercase">Play</span>
            <div className="w-1 h-1 rounded-full bg-borderLight" />
            <span className="text-xs font-bold text-primary uppercase">Learn</span>
            <div className="w-1 h-1 rounded-full bg-borderLight" />
            <span className="text-xs font-bold text-primary uppercase">Empower</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
