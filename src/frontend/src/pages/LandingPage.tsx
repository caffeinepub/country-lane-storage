import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  Boxes,
  ChevronRight,
  Clock,
  Container,
  CreditCard,
  Lock,
  Mail,
  MapPin,
  Package,
  Phone,
  Shield,
  Star,
  Thermometer,
  Warehouse,
} from "lucide-react";
import { motion } from "motion/react";

const features = [
  {
    icon: Clock,
    title: "24/7 Access",
    desc: "Access your belongings any time, day or night, with our secure keypad entry system.",
  },
  {
    icon: Thermometer,
    title: "Climate Controlled",
    desc: "Keep your valuables protected with temperature and humidity-controlled units.",
  },
  {
    icon: Shield,
    title: "Secure Facility",
    desc: "HD cameras, individually alarmed units, and on-site management keep your items safe.",
  },
  {
    icon: CreditCard,
    title: "Online Payments",
    desc: "Pay your bill online, set up auto-pay, and manage your account from anywhere.",
  },
];

const sizes = [
  {
    icon: Package,
    size: "6×6",
    price: 49,
    desc: "Perfect for boxes, seasonal decorations, or small furniture. Like a large walk-in closet.",
  },
  {
    icon: Boxes,
    size: "10×14",
    price: 89,
    desc: "Fits a studio apartment or small bedroom. Great for couches, TVs, and multiple boxes.",
  },
  {
    icon: Warehouse,
    size: "12×14",
    price: 129,
    desc: "About half a garage. Fits a 2-bedroom apartment worth of furniture with room to spare.",
  },
  {
    icon: Container,
    size: "12×16",
    price: 149,
    desc: "Spacious unit ideal for a full bedroom set, appliances, and business inventory.",
  },
  {
    icon: Warehouse,
    size: "12×28",
    price: 249,
    desc: "Like a full garage. Perfect for a full home, vehicle storage, or large business inventory.",
  },
];

const testimonials = [
  {
    name: "Michael R.",
    role: "Springfield, IL",
    quote:
      "Country Lane Storage made moving so much easier. The online portal lets me manage everything without ever calling in. Highly recommend!",
  },
  {
    name: "Jennifer K.",
    role: "Springfield, IL",
    quote:
      "I've been a customer for 2 years. The facility is always clean, the staff is responsive, and the app is genuinely great to use.",
  },
  {
    name: "David T.",
    role: "Springfield, IL",
    quote:
      "Great rates, super secure, and the 24/7 access is a lifesaver for my small business inventory. Five stars all the way.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-body">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Warehouse className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold font-display text-foreground text-lg">
              Country Lane Storage
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a
              href="#features"
              className="hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="hover:text-foreground transition-colors"
            >
              Pricing
            </a>
            <a
              href="#contact"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Log In
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="sm"
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
              >
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/assets/generated/storage-facility-hero.dim_1200x600.jpg"
            alt=""
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-primary/75" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-medium mb-6 backdrop-blur-sm">
              <Lock className="w-3.5 h-3.5" />
              Springfield's Most Trusted Storage
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-display leading-tight mb-6">
              Secure Storage
              <br />
              <span className="text-accent">Solutions</span> You
              <br />
              Can Trust
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/75 mb-8 max-w-lg leading-relaxed">
              Professional self-storage with 24/7 access, climate control, and a
              modern online portal to manage your lease, invoices, and payments.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#pricing">
                <Button
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-lg"
                >
                  View Available Units
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground bg-transparent"
                >
                  Sign Up Free
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-black/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-3 gap-4 text-center">
            {[
              { value: "500+", label: "Happy Customers" },
              { value: "16", label: "Storage Units" },
              { value: "10yr", label: "In Business" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold font-display text-accent">
                  {stat.value}
                </div>
                <div className="text-xs text-primary-foreground/60">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-3">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From your first box to your last, we've got you covered with
              professional storage solutions and modern digital tools.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-card rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow"
                >
                  <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold font-display text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-3">
              Unit Sizes & Pricing
            </h2>
            <p className="text-muted-foreground">
              Choose the storage size that fits your needs and budget.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {sizes.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.size}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-card rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1"
                >
                  <Icon className="w-8 h-8 text-accent mb-4" />
                  <div className="text-2xl font-bold font-display text-foreground mb-1">
                    {s.size} ft
                  </div>
                  <div className="text-3xl font-bold text-primary mb-3">
                    ${s.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      /mo
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {s.desc}
                  </p>
                  <Link to="/login">
                    <Button className="w-full" size="sm" variant="outline">
                      Reserve Now
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-3">
              What Our Customers Say
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-card rounded-xl p-6 shadow-card"
              >
                <div className="flex gap-0.5 mb-4">
                  {["s1", "s2", "s3", "s4", "s5"].map((key) => (
                    <Star
                      key={key}
                      className="w-4 h-4 fill-accent text-accent"
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">
                  "{t.quote}"
                </p>
                <div>
                  <div className="font-semibold text-sm text-foreground">
                    {t.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section
        id="contact"
        className="py-20 bg-primary text-primary-foreground"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-6">
                Visit Us or Get in Touch
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">Address</div>
                    <div className="text-primary-foreground/70 text-sm">
                      123 Main Street, Springfield, IL 62701
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">Phone</div>
                    <div className="text-primary-foreground/70 text-sm">
                      (217) 555-0100
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">Email</div>
                    <div className="text-primary-foreground/70 text-sm">
                      info@countrylanestorage.com
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">Office Hours</div>
                    <div className="text-primary-foreground/70 text-sm">
                      Mon–Sat 8am–6pm · Access 24/7
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white/10 rounded-xl p-8 backdrop-blur-sm"
            >
              <h3 className="text-xl font-bold font-display mb-4">
                Ready to Get Started?
              </h3>
              <p className="text-primary-foreground/70 text-sm mb-6">
                Create your free account today and start managing your storage
                unit online. No hidden fees, no contracts.
              </p>
              <Link to="/login">
                <Button
                  size="lg"
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
                >
                  Create Free Account
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <p className="text-center text-xs text-primary-foreground/50 mt-3">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="underline hover:text-primary-foreground"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground/95 text-primary-foreground/60 py-6 text-sm text-center">
        <p>
          © {new Date().getFullYear()} Country Lane Storage. Built with love
          using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary-foreground/90 transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
