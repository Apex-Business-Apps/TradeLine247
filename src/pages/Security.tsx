import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import backgroundImage from "@/assets/BACKGROUND_IMAGE1.svg";
import {
  Shield,
  Lock,
  Eye,
  Server,
  FileCheck,
  Users,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Database,
  Key,
  Activity
} from "lucide-react";
import { Link } from "react-router-dom";

const securityFeatures = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "All data in transit uses TLS 1.3. Data at rest is encrypted using AES-256 encryption standards.",
    badge: "Military Grade"
  },
  {
    icon: Server,
    title: "Secure Infrastructure",
    description: "Hosted on enterprise-grade infrastructure with 99.9% uptime SLA. Multi-region redundancy for disaster recovery.",
    badge: "Enterprise"
  },
  {
    icon: Eye,
    title: "24/7 Security Monitoring",
    description: "Continuous monitoring with real-time threat detection and automated incident response protocols.",
    badge: "Active"
  },
  {
    icon: Key,
    title: "Access Controls",
    description: "Role-based access control (RBAC), multi-factor authentication (MFA), and single sign-on (SSO) support.",
    badge: "Zero Trust"
  },
  {
    icon: Database,
    title: "Data Isolation",
    description: "Your data is logically isolated and never shared between customers. Complete data ownership and portability.",
    badge: "Private"
  },
  {
    icon: Activity,
    title: "Audit Logging",
    description: "Comprehensive audit trails for all system access and data modifications. Tamper-proof logging.",
    badge: "Compliant"
  }
];

const complianceStandards = [
  {
    name: "SOC 2 Type II",
    status: "In Progress",
    description: "Independent SOC 2 Type II attestation (AICPA Trust Services Criteria). Availability, security, confidentiality in scope.",
    icon: FileCheck
  },
  {
    name: "GDPR Compliant",
    status: "Aligned",
    description: "Controls aligned to GDPR requirements; data subject rights honored (access, erasure, portability).",
    icon: Globe
  },
  {
    name: "PIPEDA Ready",
    status: "Aligned",
    description: "Canadian privacy law alignment based on PIPEDA's Fair Information Principles.",
    icon: Shield
  },
  {
    name: "HTTPS Only",
    status: "Enforced",
    description: "All connections use HTTPS with HSTS enabled. No unencrypted traffic ever.",
    icon: Lock
  }
];

const privacyCommitments = [
  {
    title: "No Data Selling",
    description: "We never sell, rent, or share your data with third parties for marketing purposes. Your data is yours."
  },
  {
    title: "Minimal Data Collection",
    description: "We only collect data necessary to provide our service. No unnecessary tracking or profiling."
  },
  {
    title: "Right to Delete",
    description: "Request deletion of your data at any time. We honor all GDPR and PIPEDA data subject rights."
  },
  {
    title: "Transparent Processing",
    description: "Clear documentation of how we process your data. No hidden data usage or unexpected third-party sharing."
  },
  {
    title: "Data Portability",
    description: "Export your data in standard formats at any time. No vendor lock-in. Full data ownership."
  },
  {
    title: "Breach Notification",
    description: "Immediate notification within 72 hours of any security incident affecting your data, as required by law."
  }
];

const Security = () => {
  return (
    <div 
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        backgroundColor: "hsl(0, 0%, 97%)",
      }}
    >
      <SEOHead
        title="Security & Privacy - TradeLine 24/7"
        description="Enterprise-grade security and privacy for your business. SOC 2, GDPR, and PIPEDA compliant. End-to-end encryption, 24/7 monitoring, and Canadian data sovereignty."
        keywords="security, privacy, GDPR, SOC 2, encryption, data protection, compliance, PIPEDA, Canadian data"
        canonical="https://www.tradeline247ai.com/security"
      />

      <div className="relative z-10" style={{ minHeight: "100vh" }}>
        <div className="flex-1">
          {/* Hero Section */}
          <div className="bg-background/85 backdrop-blur-[2px]">
            <section className="py-20">
          <div className="container text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Security & Privacy First
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Enterprise-grade security protecting your business data. Built for Canadian businesses with Canadian data sovereignty.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Badge variant="outline" className="text-sm px-4 py-2">
                <Lock className="w-4 h-4 mr-2" />
                AES-256 Encryption
              </Badge>
              <Badge variant="outline" className="text-sm px-4 py-2">
                <Globe className="w-4 h-4 mr-2" />
                GDPR Aligned
              </Badge>
              <Badge variant="outline" className="text-sm px-4 py-2">
                <Shield className="w-4 h-4 mr-2" />
                SOC 2 Ready
              </Badge>
              <Badge variant="outline" className="text-sm px-4 py-2">
                <FileCheck className="w-4 h-4 mr-2" />
                PIPEDA Aligned
              </Badge>
            </div>
          </div>
            </section>
          </div>

          {/* Security Features */}
          <div className="bg-background/85 backdrop-blur-[2px]">
            <section className="py-20">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Enterprise-Grade Security</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Multiple layers of security protecting your data at every level.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {securityFeatures.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {feature.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
            </section>
          </div>

          {/* Compliance Standards */}
          <div className="bg-background/85 backdrop-blur-[2px]">
            <section className="py-20">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Compliance & Standards</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Aligned with recognized standards. Independent assessments where applicable.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {complianceStandards.map((standard, index) => (
                <Card key={index} className="bg-background/80 backdrop-blur">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <standard.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{standard.name}</CardTitle>
                          <Badge
                            variant={standard.status === "Aligned" || standard.status === "Enforced" ? "default" : "secondary"}
                            className="mt-1 text-xs"
                          >
                            {standard.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{standard.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Card className="inline-block bg-background/80 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 text-left">
                    <AlertTriangle className="w-8 h-8 text-primary flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-semibold mb-1">Security Vulnerability Reporting</p>
                      <p className="text-sm text-muted-foreground">
                        Found a security issue? Email us at{" "}
                        <a href="mailto:security@tradeline247ai.com" className="text-primary hover:underline">
                          security@tradeline247ai.com
                        </a>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
            </section>
          </div>

          {/* Privacy Commitments */}
          <div className="bg-background/85 backdrop-blur-[2px]">
            <section className="py-20">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Privacy Commitments</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Your data, your rights. We're committed to protecting your privacy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {privacyCommitments.map((commitment, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[hsl(142,85%,25%)] flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <CardTitle className="text-base">{commitment.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{commitment.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
            </section>
          </div>

          {/* Data Handling */}
          <div className="bg-background/85 backdrop-blur-[2px]">
            <section className="py-20">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">How We Handle Your Data</h2>
                <p className="text-lg text-muted-foreground">
                  Transparency in every step of data processing.
                </p>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-primary" />
                      Data Collection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      We collect only the minimum data necessary to provide our AI receptionist service:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Business contact information (name, email, phone number)</li>
                      <li>Call transcripts and recordings (with your customers' consent)</li>
                      <li>Usage analytics to improve service quality</li>
                      <li>Payment information (processed securely by Stripe)</li>
                    </ul>
                    <p className="italic">
                      We never collect unnecessary personal information or use tracking pixels for advertising.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="w-5 h-5 text-primary" />
                      Data Storage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      Your data is stored securely with industry-leading protections:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Encrypted at rest using AES-256 encryption</li>
                      <li>Stored in Canadian data centers (for Canadian customers)</li>
                      <li>Automated backups with 99.9% durability guarantee</li>
                      <li>Geographically redundant storage for disaster recovery</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Data Sharing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      We only share data when absolutely necessary:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>With service providers under strict data processing agreements (DPAs)</li>
                      <li>When required by law (with notification when legally permitted)</li>
                      <li>With your explicit consent for integrations you enable</li>
                    </ul>
                    <p className="font-semibold text-foreground">
                      We never sell your data to third parties. Period.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-primary" />
                      Data Retention
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      We retain data only as long as necessary:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Active account data: retained during your subscription</li>
                      <li>Call recordings: 90 days by default (configurable)</li>
                      <li>Account data after cancellation: 30 days, then permanently deleted</li>
                      <li>Financial records: 7 years (legal requirement)</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
            </section>
          </div>

          {/* CTA Section */}
          <div className="bg-background/85 backdrop-blur-[2px]">
            <section className="py-20">
          <div className="container">
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="pt-12 pb-12 text-center">
                <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-4">Questions About Security?</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Our team is here to answer your security and compliance questions.
                  We take your data protection seriously.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    <Link to="/contact">Contact Security Team</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="mailto:security@tradeline247ai.com">Report Vulnerability</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
            </section>
          </div>
        </main>
        
        <div className="bg-background/85 backdrop-blur-[2px]">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Security;
