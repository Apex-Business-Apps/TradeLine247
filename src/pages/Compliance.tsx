import { AppLayout } from '@/components/Layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  Circle, 
  ExternalLink, 
  AlertTriangle,
  FileText,
  Shield 
} from 'lucide-react';

export default function Compliance() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Center</h1>
          <p className="text-muted-foreground mt-2">
            Regulatory compliance checklists and resources for Canadian, US, and EU markets
          </p>
        </div>

        <Tabs defaultValue="canada">
          <TabsList>
            <TabsTrigger value="canada">Canada</TabsTrigger>
            <TabsTrigger value="us">United States</TabsTrigger>
            <TabsTrigger value="eu">European Union</TabsTrigger>
            <TabsTrigger value="dealer">Dealer Regulations</TabsTrigger>
          </TabsList>

          {/* Canadian Compliance */}
          <TabsContent value="canada" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  CASL (Canada's Anti-Spam Legislation)
                </CardTitle>
                <CardDescription>
                  Federal law regulating commercial electronic messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Express Consent Tracking</p>
                      <p className="text-sm text-muted-foreground">
                        Separate checkboxes for SMS, email, and marketing communications
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Consent Proof Storage</p>
                      <p className="text-sm text-muted-foreground">
                        Timestamp, IP address, user agent, and channel logged
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">One-Click Unsubscribe</p>
                      <p className="text-sm text-muted-foreground">
                        Automated unsubscribe links in all marketing emails
                      </p>
                      <Badge variant="outline" className="mt-1">Planned</Badge>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Quiet Hours Enforcement</p>
                      <p className="text-sm text-muted-foreground">
                        Restrict communications to 9 AM - 9 PM local time
                      </p>
                      <Badge variant="outline" className="mt-1">Planned</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://crtc.gc.ca/eng/internet/anti.htm" target="_blank" rel="noopener">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    CRTC CASL Resources
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>PIPEDA (Privacy Law)</CardTitle>
                <CardDescription>
                  Personal Information Protection and Electronic Documents Act
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Meaningful Consent</p>
                      <p className="text-sm text-muted-foreground">
                        Clear, specific consent for each data use purpose
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Audit Logging</p>
                      <p className="text-sm text-muted-foreground">
                        Comprehensive audit trail for all data access
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Data Access Requests</p>
                      <p className="text-sm text-muted-foreground">
                        Self-service portal for individuals to access their data
                      </p>
                      <Badge variant="outline" className="mt-1">Planned</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/" target="_blank" rel="noopener">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Privacy Commissioner Resources
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quebec Law-25 (Bill 64)</CardTitle>
                <CardDescription>
                  Enhanced privacy requirements for Quebec operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Jurisdiction Awareness</p>
                      <p className="text-sm text-muted-foreground">
                        Quebec-specific consent forms and privacy notices
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Breach Notification (72h)</p>
                      <p className="text-sm text-muted-foreground">
                        Automated workflow for CAI notification
                      </p>
                      <Badge variant="outline" className="mt-1">Planned</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://www.cai.gouv.qc.ca/modernisation/" target="_blank" rel="noopener">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    CAI Quebec Resources
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* US Compliance */}
          <TabsContent value="us" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>TCPA (Telephone Consumer Protection Act)</CardTitle>
                <CardDescription>
                  Prior express written consent for marketing calls/texts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Explicit Phone/SMS Consent</p>
                      <p className="text-sm text-muted-foreground">
                        Separate consent checkboxes with clear language
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Consent Logging</p>
                      <p className="text-sm text-muted-foreground">
                        Timestamp, IP, and proof of consent stored
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">DNC List Integration</p>
                      <p className="text-sm text-muted-foreground">
                        Check against Do-Not-Call registry before dialing
                      </p>
                      <Badge variant="outline" className="mt-1">Planned</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://www.fcc.gov/consumers/guides/stop-unwanted-robocalls-and-texts" target="_blank" rel="noopener">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    FCC TCPA Guide
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>FCRA (Fair Credit Reporting Act)</CardTitle>
                <CardDescription>
                  Credit application and reporting compliance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Credit Pull Consent</p>
                      <p className="text-sm text-muted-foreground">
                        Explicit checkbox with timestamp logging
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Soft Pull Default</p>
                      <p className="text-sm text-muted-foreground">
                        Soft inquiries do not affect credit score
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">FCRA Disclosure Delivery</p>
                      <p className="text-sm text-muted-foreground">
                        Automated PDF generation and delivery
                      </p>
                      <Badge variant="outline" className="mt-1">Planned</Badge>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Adverse Action Notices</p>
                      <p className="text-sm text-muted-foreground">
                        Automated notices when credit is denied
                      </p>
                      <Badge variant="outline" className="mt-1">Planned</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://www.consumerfinance.gov/rules-policy/regulations/1022/" target="_blank" rel="noopener">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    CFPB FCRA Summary
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>GLBA Safeguards Rule</CardTitle>
                <CardDescription>
                  Information security program requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Access Controls</p>
                      <p className="text-sm text-muted-foreground">
                        Role-based access control with audit logging
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Encryption</p>
                      <p className="text-sm text-muted-foreground">
                        TLS in transit, encryption at rest
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Audit Logging</p>
                      <p className="text-sm text-muted-foreground">
                        Comprehensive security event logging
                      </p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://www.ftc.gov/business-guidance/resources/ftc-safeguards-rule-what-your-business-needs-know" target="_blank" rel="noopener">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    FTC Safeguards Guide
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EU Compliance */}
          <TabsContent value="eu" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>GDPR (General Data Protection Regulation)</CardTitle>
                <CardDescription>
                  EU privacy regulation for data processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Lawful Basis for Processing</p>
                      <p className="text-sm text-muted-foreground">
                        Consent-based data processing with purpose limitation
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Data Minimization</p>
                      <p className="text-sm text-muted-foreground">
                        Collect only necessary data for specified purposes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Data Subject Rights (DSAR)</p>
                      <p className="text-sm text-muted-foreground">
                        Access, rectification, erasure, portability endpoints
                      </p>
                      <Badge variant="outline" className="mt-1">Planned</Badge>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium">Cross-Border Transfers</p>
                      <p className="text-sm text-muted-foreground">
                        Standard Contractual Clauses (SCCs) required for non-EU data
                      </p>
                      <Badge variant="outline" className="mt-1">Template Available</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://gdpr-info.eu/" target="_blank" rel="noopener">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    GDPR Official Text
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dealer Regulations */}
          <TabsContent value="dealer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ontario - OMVIC</CardTitle>
                <CardDescription>
                  Ontario Motor Vehicle Industry Council
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm">
                    <strong>Requirements:</strong> Valid dealer registration, advertising standards, 
                    disclosure of material facts, customer complaint handling, sales representative registration.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://www.omvic.on.ca/" target="_blank" rel="noopener">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      OMVIC Registration
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://georgian-omvic-certificationcourse.ca/" target="_blank" rel="noopener">
                      <FileText className="h-4 w-4 mr-2" />
                      Certification Course
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alberta - AMVIC</CardTitle>
                <CardDescription>
                  Alberta Motor Vehicle Industry Council
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm">
                    <strong>Requirements:</strong> Business license, salesperson registration, 
                    display license at premises, advertising compliance, record keeping.
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://amvic.org/" target="_blank" rel="noopener">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    AMVIC Licensing
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>British Columbia - VSA</CardTitle>
                <CardDescription>
                  Vehicle Sales Authority of BC
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm">
                    <strong>Requirements:</strong> Dealer license, salesperson registration, 
                    advertising rules, consumer protection disclosure, complaints process.
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://mvsabc.com/" target="_blank" rel="noopener">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    VSA BC
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Saskatchewan & Manitoba</CardTitle>
                <CardDescription>
                  Provincial dealer requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm">
                    <strong>Saskatchewan (FCAA):</strong> Dealer registration, advertising standards, disclosure requirements
                  </p>
                  <p className="text-sm">
                    <strong>Manitoba (MPI):</strong> Vehicle dealer permit, compliance with Consumer Protection Act
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://www.fcaa.gov.sk.ca/" target="_blank" rel="noopener">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      FCAA SK
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://www.mpi.mb.ca/Pages/dealer-services.aspx" target="_blank" rel="noopener">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      MPI Manitoba
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
