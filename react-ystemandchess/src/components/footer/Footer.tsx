import { FaLinkedin, FaSquareInstagram, FaFacebook, FaSquareXTwitter } from "react-icons/fa6";

const Footer = () => {
  return (
    <footer className="bg-background shadow-soft-up">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          
          {/* Left: Branding */}
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-primary">
              YSTEM<span className="text-text-primary">&Chess</span>
            </h2>
            <p className="text-text-secondary text-sm mt-2 tracking-wide">
              Empowering Tomorrow's STEM Leaders
            </p>
          </div>

          {/* Center: Contact */}
          <div className="flex flex-col sm:flex-row gap-8 items-center">
            <a href="mailto:info@ystemandchess.com" className="group flex flex-col items-center md:items-start">
              <span className="text-xs text-primary uppercase font-bold tracking-wide mb-1.5">Email</span>
              <span className="text-base font-medium text-text-primary border-b-2 border-transparent group-hover:border-primary transition-all">
                info@ystemandchess.com
              </span>
            </a>
            <a href="tel:+12089965071" className="group flex flex-col items-center md:items-start">
              <span className="text-xs text-primary uppercase font-bold tracking-wide mb-1.5">Phone</span>
              <span className="text-base font-medium text-text-primary border-b-2 border-transparent group-hover:border-primary transition-all">
                (208) 996-5071
              </span>
            </a>
          </div>

          {/* Right: Socials */}
          <div className="flex gap-3">
            <a 
              href="https://web.facebook.com/YSTEMandChess" 
              aria-label="Facebook" 
              className="p-2.5 hover:bg-background-soft rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {FaFacebook({ size: 24, color: '#1F1F1F' }) as any}
            </a>
            <a 
              href="https://www.instagram.com/stemwithstemy" 
              aria-label="Instagram" 
              className="p-2.5 hover:bg-background-soft rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {FaSquareInstagram({ size: 24, color: '#1F1F1F' }) as any}
            </a>
            <a 
              href="https://x.com/ystemandchess" 
              aria-label="Twitter" 
              className="p-2.5 hover:bg-background-soft rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {FaSquareXTwitter({ size: 24, color: '#1F1F1F' }) as any}
            </a>
            <a 
              href="https://www.linkedin.com/company/ystemandchessinc" 
              aria-label="LinkedIn" 
              className="p-2.5 hover:bg-background-soft rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {FaLinkedin({ size: 24, color: '#1F1F1F' }) as any}
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-border-light text-center">
          <p className="text-xs text-text-secondary">
            © {new Date().getFullYear()} Y STEM and Chess Inc.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
