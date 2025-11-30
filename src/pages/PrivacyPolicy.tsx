import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';

export function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#13171B]">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-[#E8EAE7] mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-600 dark:text-[#B7BAAE]">Last updated: November 2025</p>
        </div>

        <div className="bg-white dark:bg-[#1B1F23] rounded-lg border border-gray-200 dark:border-[#2A3136] p-6 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">1. Introduction</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>
                This Privacy Policy explains how Tailor Notebook processes personal data in compliance with the General Data Protection Regulation (GDPR) and Swedish data protection law.
              </p>
              <div className="bg-gray-50 dark:bg-[#13171B] p-4 rounded-lg border border-gray-200 dark:border-[#2A3136]">
                <p className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Service Provider:</p>
                <p>Tailor Notebook is operated by:</p>
                <ul className="list-none space-y-1 ml-4 mt-2">
                  <li><span className="font-medium">Name:</span> Vu Dong Lam Nguyen</li>
                  <li><span className="font-medium">Organization number:</span> Sole proprietor</li>
                  <li><span className="font-medium">Address:</span> [Your Business Address]</li>
                  <li><span className="font-medium">Email:</span> lam.vudongnguyen@gmail.com</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">2. Roles and Responsibilities</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-[#E8EAE7] mb-2">Data Controller</h3>
                <p className="mb-2">The tailoring business using Tailor Notebook is the Data Controller for client data.</p>
                <p className="mb-2">The controller determines:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>What client data is collected</li>
                  <li>How long data is kept</li>
                  <li>Lawful basis for processing</li>
                  <li>Responses to GDPR requests from clients</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-[#E8EAE7] mb-2">Data Processor</h3>
                <p className="mb-2">Tailor Notebook (the service provider) is the Data Processor.</p>
                <p className="mb-2">The processor handles:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Hosting and infrastructure</li>
                  <li>Storage and backups</li>
                  <li>Technical processing</li>
                  <li>Security safeguards</li>
                  <li>Sub-processor management</li>
                </ul>
              </div>
              <p className="italic">
                A Data Processing Agreement (DPA) is included in the Service Agreement signed by the tailoring business and governs this relationship in accordance with GDPR Article 28.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">3. Personal Data Processed</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">3.1 User Account Data (Tailor + Staff)</h3>
                <p className="mb-2">For the tailoring business owner and authorized staff members (the processor's direct users):</p>
                <p className="font-medium mb-1">Data collected:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-2">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Authentication data (password hash)</li>
                  <li>Role and permissions</li>
                </ul>
                <p><span className="font-medium">Legal basis:</span> Contractual necessity (providing the service)</p>
                <p><span className="font-medium">Retention:</span> Duration of active account plus 30 days for backup purge after account deletion</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">3.2 Client Data (Entered by the Tailor)</h3>
                <p className="mb-2">The tailoring business (Data Controller) enters and manages:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-2">
                  <li>Client names and contact information</li>
                  <li>Body measurements</li>
                  <li>Session notes and preferences</li>
                  <li>Order history and status</li>
                  <li>Payment information (deposits, balances)</li>
                  <li>Internal business notes</li>
                </ul>
                <p className="font-medium">Important: The controller must ensure clients are properly informed before their data is stored in Tailor Notebook.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">3.3 Business Data</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Fabric inventory lists</li>
                  <li>Task lists and assignments</li>
                  <li>Internal workflow information</li>
                  <li>Customer queries and communications</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">3.4 System Data</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Security logs (login attempts, access records)</li>
                  <li>Device and browser metadata (for authentication security only)</li>
                  <li>Error logs and system performance data</li>
                  <li>Timestamps and session information</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">4. Legal Basis for Processing</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">For Client Data (Controller's Responsibility)</h3>
                <p className="mb-2">The controller determines the lawful basis for processing client data. Common bases include:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><span className="font-medium">Contractual necessity:</span> Providing tailoring services to clients</li>
                  <li><span className="font-medium">Legitimate interest:</span> Managing client records and business workflow</li>
                  <li><span className="font-medium">Legal obligation:</span> Accounting or record-keeping duties</li>
                  <li><span className="font-medium">Consent:</span> Where required for specific processing activities</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">For Account Data (Processor as Controller)</h3>
                <p className="mb-2">For the tailoring business's own account information, Tailor Notebook processes data based on:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><span className="font-medium">Contractual necessity:</span> Providing the Tailor Notebook service</li>
                </ul>
              </div>

              <p className="italic">The processor acts only on documented instructions from the controller for all client data processing.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">5. Purpose of Processing</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>Personal data is processed for the following purposes:</p>

              <div>
                <p className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-1">Client Management:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Managing client information and contact details</li>
                  <li>Recording measurements and tailoring specifications</li>
                  <li>Tracking order status and history</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-1">Service Delivery:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Tracking tasks, queries, and workflow</li>
                  <li>Managing fabric inventory and internal operations</li>
                  <li>Facilitating communication with clients</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-1">Security & Operations:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Ensuring security and service functionality</li>
                  <li>Preventing unauthorized access</li>
                  <li>Maintaining system performance</li>
                  <li>Providing technical support</li>
                </ul>
              </div>

              <p className="italic">The processor does not use or access client data for any independent purpose beyond providing the service.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">6. Data Storage and Security</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Storage Location</h3>
                <p>All data is stored on Supabase servers in the <span className="font-medium">EU region (Stockholm, Sweden)</span>.</p>
                <p className="font-medium">No data is stored outside the European Union.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Security Measures</h3>
                <p className="mb-2">Data is protected by:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><span className="font-medium">Encryption in transit:</span> TLS 1.3 / HTTPS</li>
                  <li><span className="font-medium">Encryption at rest:</span> AES-256</li>
                  <li><span className="font-medium">Role-based access controls:</span> Restricting data access by user permissions</li>
                  <li><span className="font-medium">Secure authentication:</span> Password hashing and secure session management</li>
                  <li><span className="font-medium">Regular backups:</span> Daily automated backups with 30-day retention</li>
                  <li><span className="font-medium">Audit logging:</span> Security event tracking for unauthorized access detection</li>
                  <li><span className="font-medium">Infrastructure security:</span> Firewall protection, intrusion detection, security monitoring</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Sub-Processor</h3>
                <p className="mb-2">Supabase Inc. acts as a sub-processor under our Data Processing Agreement for:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Database hosting</li>
                  <li>Authentication services</li>
                  <li>Backup storage</li>
                </ul>
                <p className="mt-2">Supabase's privacy policy: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">https://supabase.com/privacy</a></p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">7. Data Sharing and Sub-Processors</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Authorized Sub-Processors</h3>
                <div className="bg-gray-50 dark:bg-[#13171B] p-4 rounded-lg border border-gray-200 dark:border-[#2A3136]">
                  <p className="font-medium mb-2">Supabase Inc.</p>
                  <ul className="list-none space-y-1 ml-4">
                    <li><span className="font-medium">Purpose:</span> Database hosting and authentication</li>
                    <li><span className="font-medium">Location:</span> EU (Stockholm, Sweden)</li>
                    <li><span className="font-medium">Website:</span> supabase.com</li>
                    <li><span className="font-medium">Privacy Policy:</span> <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">https://supabase.com/privacy</a></li>
                  </ul>
                </div>
                <p className="mt-2 italic">
                  The tailoring business (controller) authorizes use of these sub-processors by accepting the Service Agreement.
                </p>
                <p>
                  Tailor Notebook will notify controllers at least 30 days in advance of any changes to sub-processors. Controllers may object to new sub-processors within this period.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">No Third-Party Sharing</h3>
                <p className="mb-2">Personal data is <span className="font-medium">not</span>:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Sold to third parties</li>
                  <li>Shared with advertisers</li>
                  <li>Used for marketing purposes</li>
                  <li>Transferred outside the EU</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Legal Disclosures</h3>
                <p className="mb-2">Data may be disclosed only:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>To legal authorities when required by Swedish or EU law</li>
                  <li>In response to valid legal process (court orders, subpoenas)</li>
                  <li>To protect rights, safety, or property when legally permitted</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">8. Data Subject Rights</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <p className="font-medium bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                Client data belongs to the tailoring business (Data Controller). <span className="font-semibold">Clients wishing to exercise GDPR rights must contact their tailor directly.</span>
              </p>

              <p>Data subjects have the following rights under GDPR:</p>

              <div className="space-y-2">
                <div>
                  <p className="font-medium text-gray-900 dark:text-[#E8EAE7]">Right of Access (Article 15)</p>
                  <p>Request a copy of their personal data</p>
                </div>

                <div>
                  <p className="font-medium text-gray-900 dark:text-[#E8EAE7]">Right to Rectification (Article 16)</p>
                  <p>Request correction of inaccurate or incomplete data</p>
                </div>

                <div>
                  <p className="font-medium text-gray-900 dark:text-[#E8EAE7]">Right to Erasure (Article 17)</p>
                  <p>Request deletion of their personal data ("right to be forgotten")</p>
                </div>

                <div>
                  <p className="font-medium text-gray-900 dark:text-[#E8EAE7]">Right to Restriction (Article 18)</p>
                  <p>Request limitation of processing in certain circumstances</p>
                </div>

                <div>
                  <p className="font-medium text-gray-900 dark:text-[#E8EAE7]">Right to Data Portability (Article 20)</p>
                  <p>Receive their data in a structured, machine-readable format</p>
                </div>

                <div>
                  <p className="font-medium text-gray-900 dark:text-[#E8EAE7]">Right to Object (Article 21)</p>
                  <p>Object to processing based on legitimate interests</p>
                </div>

                <div>
                  <p className="font-medium text-gray-900 dark:text-[#E8EAE7]">Right to Withdraw Consent</p>
                  <p>Where processing is based on consent, withdraw consent at any time</p>
                </div>

                <div>
                  <p className="font-medium text-gray-900 dark:text-[#E8EAE7]">Right to Lodge a Complaint</p>
                  <p>Data subjects have the right to lodge a complaint with the supervisory authority:</p>
                  <div className="bg-gray-50 dark:bg-[#13171B] p-4 rounded-lg border border-gray-200 dark:border-[#2A3136] mt-2">
                    <p className="font-medium mb-2">Swedish Authority for Privacy Protection (Integritetsskyddsmyndigheten - IMY)</p>
                    <ul className="list-none space-y-1 ml-4">
                      <li><span className="font-medium">Website:</span> imy.se</li>
                      <li><span className="font-medium">Email:</span> imy@imy.se</li>
                      <li><span className="font-medium">Phone:</span> +46 8 657 61 00</li>
                      <li><span className="font-medium">Address:</span> Box 8114, 104 20 Stockholm, Sweden</li>
                    </ul>
                  </div>
                  <p className="mt-2 font-medium">Complaints should first be directed to the tailoring business (Data Controller).</p>
                </div>
              </div>

              <p className="italic">
                Tailor Notebook (processor) supports the controller technically in fulfilling these requests by providing appropriate tools and data export capabilities.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">9. Data Retention</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Controller's Responsibility</h3>
                <p className="mb-2">The tailoring business (Data Controller) determines how long client personal data is retained based on:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Legal obligations (accounting, tax records)</li>
                  <li>Business needs (client relationship duration)</li>
                  <li>Contractual requirements</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Processor's Retention</h3>
                <p className="mb-2">Tailor Notebook (Data Processor) retains data only:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>As long as the controller's account is active</li>
                  <li>As instructed by the controller</li>
                  <li>For security logs: Up to 90 days for security and compliance purposes</li>
                  <li>In backups: Up to 30 days after deletion (backups automatically purged)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Account Deletion</h3>
                <p className="mb-2">Upon account deletion by the controller:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>All client and business data is permanently deleted within 7 days</li>
                  <li>Data becomes inaccessible immediately upon deletion request</li>
                  <li>Backups containing deleted data are purged within 30 days</li>
                  <li>Controller receives final data export opportunity before deletion</li>
                  <li>Deletion is irreversible</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">10. Cookies and Tracking</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <p>Tailor Notebook uses <span className="font-medium">only essential cookies</span> required for service functionality:</p>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Essential Cookies</h3>

                <div className="bg-gray-50 dark:bg-[#13171B] p-4 rounded-lg border border-gray-200 dark:border-[#2A3136] mb-3">
                  <p className="font-medium mb-2">Authentication Cookie</p>
                  <ul className="list-none space-y-1 ml-4">
                    <li><span className="font-medium">Name:</span> <code className="bg-gray-200 dark:bg-[#2A3136] px-1 rounded">sb-[project]-auth-token</code></li>
                    <li><span className="font-medium">Purpose:</span> Maintain user login session</li>
                    <li><span className="font-medium">Duration:</span> Session-based (deleted when browser closes) or 30 days if "Remember me" selected</li>
                    <li><span className="font-medium">Type:</span> First-party, essential</li>
                  </ul>
                </div>

                <div className="bg-gray-50 dark:bg-[#13171B] p-4 rounded-lg border border-gray-200 dark:border-[#2A3136]">
                  <p className="font-medium mb-2">Preference Cookie</p>
                  <ul className="list-none space-y-1 ml-4">
                    <li><span className="font-medium">Name:</span> <code className="bg-gray-200 dark:bg-[#2A3136] px-1 rounded">theme-preference</code></li>
                    <li><span className="font-medium">Purpose:</span> Remember user interface settings (light/dark mode)</li>
                    <li><span className="font-medium">Duration:</span> 1 year</li>
                    <li><span className="font-medium">Type:</span> First-party, essential</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">No Tracking</h3>
                <p className="mb-2">Tailor Notebook does <span className="font-medium">not</span> use:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Analytics cookies</li>
                  <li>Advertising cookies</li>
                  <li>Third-party tracking</li>
                  <li>Cross-site tracking</li>
                  <li>Social media plugins</li>
                  <li>Marketing pixels</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">11. International Data Transfers</h2>
            <div className="space-y-2 text-gray-700 dark:text-[#B7BAAE]">
              <p className="font-medium">All data is stored exclusively within the <span className="text-gray-900 dark:text-[#E8EAE7]">European Union (EU)</span>.</p>
              <p className="font-medium">No international data transfers outside the EU occur.</p>
              <p>All sub-processors are EU-based and GDPR-compliant.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">12. Children's Privacy</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>Tailor Notebook is intended for business use by tailoring professionals.</p>
              <p className="font-medium">The service is <span className="text-gray-900 dark:text-[#E8EAE7]">not directed at individuals under 16 years of age</span>.</p>
              <p className="mb-2">If client data includes information about minors, the tailoring business (Data Controller) must:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Obtain appropriate consent from parents/guardians where required</li>
                <li>Ensure lawful basis for processing minor's data</li>
                <li>Comply with additional protections for children's data under GDPR</li>
              </ul>
              <p className="mt-3">Tailor Notebook does not knowingly collect personal data from children under 16 for account creation.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">13. Changes to This Policy</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <p>Tailor Notebook may update this Privacy Policy from time to time to reflect:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Changes in data processing practices</li>
                <li>Legal or regulatory requirements</li>
                <li>New features or services</li>
                <li>Feedback from users or authorities</li>
              </ul>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Notification of Changes</h3>
                <p className="mb-2">Material changes will be communicated by:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Email notification to registered account holders at least 30 days before taking effect</li>
                  <li>In-app notification upon next login</li>
                  <li>Updated "Last updated" date at the top of this policy</li>
                  <li>Notice on the Tailor Notebook website</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Acceptance of Changes</h3>
                <p>Continued use of the service after the effective date constitutes acceptance of the updated Privacy Policy.</p>
                <p>Users may terminate service if they do not agree with material changes by providing written notice before the effective date.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Non-Material Changes</h3>
                <p>Minor changes (typographical corrections, clarifications, formatting) may be made without advance notice.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">14. Security Logging</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <p>To maintain the security and integrity of the service, Tailor Notebook records essential authentication and system events.</p>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Logged Events</h3>
                <p className="mb-2">Security logs may include:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Successful and failed login attempts</li>
                  <li>Access timestamps and IP addresses</li>
                  <li>Device and browser metadata (user agent)</li>
                  <li>Account creation and modification events</li>
                  <li>Password reset requests</li>
                  <li>System errors and operational events</li>
                  <li>API access and rate limiting events</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Use of Logs</h3>
                <p className="mb-2">Security logs are used solely for:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Detecting and preventing unauthorized access</li>
                  <li>Investigating security incidents</li>
                  <li>Troubleshooting technical issues</li>
                  <li>Ensuring service performance and reliability</li>
                  <li>Fraud prevention</li>
                </ul>
                <p className="mt-2 mb-2">Tailor Notebook does <span className="font-medium">not</span> use security logs for:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>User profiling or behavioral analysis</li>
                  <li>Marketing or advertising purposes</li>
                  <li>Sharing with third parties (except as legally required)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Log Retention</h3>
                <p>Security logs are retained for <span className="font-medium">90 days</span>, after which they are automatically deleted.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">15. Personal Data Breaches</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Processor's Obligations</h3>
                <p className="mb-2">As a Data Processor, Tailor Notebook maintains internal procedures to detect and assess potential personal data breaches.</p>
                <p className="mb-2">If Tailor Notebook becomes aware of a breach affecting personal data processed on behalf of the tailoring business (Data Controller), we will:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Notify the controller <span className="font-medium">without undue delay</span> (target: within 24 hours of discovery)</li>
                  <li>Provide all relevant technical information about the incident</li>
                  <li>Describe the nature of the breach, categories of data affected, and approximate number of records</li>
                  <li>Outline measures taken to mitigate the breach</li>
                  <li>Recommend actions the controller should consider</li>
                </ul>
                <p className="mt-2 italic">This complies with GDPR Article 33(2) requirements for processor notification.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Controller's Responsibilities</h3>
                <p className="mb-2">The Data Controller is responsible for:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Assessing the risk to affected individuals</li>
                  <li>Notifying the supervisory authority (IMY) within 72 hours where required under GDPR Article 33</li>
                  <li>Communicating breaches to affected clients when required under GDPR Article 34</li>
                  <li>Documenting breach response and decisions</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Processor Support</h3>
                <p className="mb-2">Tailor Notebook supports the controller by:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Providing detailed technical information</li>
                  <li>Assisting with breach investigation</li>
                  <li>Implementing additional security measures to prevent recurrence</li>
                  <li>Cooperating with supervisory authorities as needed</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">16. Data Processing Agreement (DPA)</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <p>As required by GDPR Article 28, a Data Processing Agreement governs the relationship between:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
                <li>The tailoring business (Data Controller)</li>
                <li>Tailor Notebook (Data Processor)</li>
              </ul>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">DPA Inclusion</h3>
                <p className="mb-2">The DPA is included as part of the Service Agreement signed by each tailoring business and covers:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Subject matter and duration of processing</li>
                  <li>Nature and purpose of processing</li>
                  <li>Types of personal data processed</li>
                  <li>Categories of data subjects</li>
                  <li>Controller and processor obligations</li>
                  <li>Security measures and requirements</li>
                  <li>Sub-processor authorization and requirements</li>
                  <li>Data subject rights assistance</li>
                  <li>Breach notification procedures</li>
                  <li>Data deletion and return upon termination</li>
                  <li>Audit rights and processor compliance</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">DPA Availability</h3>
                <p className="mb-2">The full DPA is available:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>As part of the signed Service Agreement</li>
                  <li>Upon request from existing customers</li>
                  <li>For review by prospective customers before signup</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">17. Contact Information</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">For Data Protection Inquiries</h3>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-3">
                  <p className="font-medium mb-2">If you are a client of a tailoring business:</p>
                  <p>Contact your tailor directly for GDPR requests (access, correction, deletion, etc.).</p>
                  <p className="mt-1">The tailoring business is the Data Controller of your personal information.</p>
                </div>

                <div className="bg-gray-50 dark:bg-[#13171B] p-4 rounded-lg border border-gray-200 dark:border-[#2A3136]">
                  <p className="font-medium mb-2">If you are a tailoring business using Tailor Notebook:</p>
                  <p className="mb-3">For processor-related inquiries or technical support:</p>
                  <p className="font-medium mb-2">Tailor Notebook</p>
                  <ul className="list-none space-y-1 ml-4">
                    <li><span className="font-medium">Operated by:</span> Vu Dong Lam Nguyen</li>
                    <li><span className="font-medium">Organization number:</span> Sole proprietor</li>
                    <li><span className="font-medium">Address:</span> [Your Business Address]</li>
                    <li><span className="font-medium">Email (Privacy):</span> lam.vudongnguyen@gmail.com</li>
                    <li><span className="font-medium">Email (Support):</span> lam.vudongnguyen@gmail.com</li>
                    <li><span className="font-medium">Email (General):</span> lam.vudongnguyen@gmail.com</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Response Times</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Privacy inquiries: Within 5 business days</li>
                  <li>Technical support: Within 24 hours (weekdays)</li>
                  <li>GDPR requests: As required to meet controller's obligations (typically within 30 days)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">18. Supervisory Authority</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>Data protection matters in Sweden are overseen by:</p>
              <div className="bg-gray-50 dark:bg-[#13171B] p-4 rounded-lg border border-gray-200 dark:border-[#2A3136]">
                <p className="font-medium mb-2">Swedish Authority for Privacy Protection</p>
                <p className="font-medium mb-2">Integritetsskyddsmyndigheten (IMY)</p>
                <ul className="list-none space-y-1 ml-4">
                  <li><span className="font-medium">Website:</span> imy.se</li>
                  <li><span className="font-medium">Email:</span> imy@imy.se</li>
                  <li><span className="font-medium">Phone:</span> +46 8 657 61 00</li>
                  <li><span className="font-medium">Address:</span> Box 8114, 104 20 Stockholm, Sweden</li>
                </ul>
              </div>
              <p className="mt-3">Both controllers and processors are subject to IMY oversight for GDPR compliance.</p>
            </div>
          </section>

          <div className="border-t border-gray-200 dark:border-[#2A3136] pt-6 mt-8">
            <p className="text-center text-sm text-gray-600 dark:text-[#B7BAAE] italic">
              This Privacy Policy is effective as of the "Last updated" date shown above and applies to all data processing activities by Tailor Notebook.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
