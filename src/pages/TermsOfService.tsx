import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';

export function TermsOfService() {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-[#E8EAE7] mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-600 dark:text-[#B7BAAE]">Last updated: December 2025</p>
        </div>

        <div className="bg-white dark:bg-[#1B1F23] rounded-lg border border-gray-200 dark:border-[#2A3136] p-6 space-y-8">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">1. Acceptance of Terms</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>
                By accessing or using Tailor Notebook ("the Service"), you agree to be bound by these Terms of Service ("Terms").
              </p>
              <p>
                If you do not agree to these Terms, you may not use the Service.
              </p>
              <p>
                These Terms constitute a legally binding agreement between you (the "Controller" or "User") and Tailor Notebook (the "Processor" or "Service Provider").
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">2. Service Provider Information</h2>
            <div className="bg-gray-50 dark:bg-[#13171B] p-4 rounded-lg border border-gray-200 dark:border-[#2A3136]">
              <p className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Tailor Notebook is operated by:</p>
              <ul className="list-none space-y-1 ml-4 text-gray-700 dark:text-[#B7BAAE]">
                <li><span className="font-medium">Name:</span> Vu Dong Lam Nguyen</li>
                <li><span className="font-medium">Status:</span> Individual service provider (sole proprietor)</li>
                <li><span className="font-medium">Address:</span> Lisa-Fittko-Str 5, 10557 Berlin, Germany</li>
                <li><span className="font-medium">Email:</span> lam.vudongnguyen@gmail.com</li>
                <li><span className="font-medium">Phone:</span> +49 15257431776</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">3. Description of Service</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <p>
                Tailor Notebook is a cloud-based management system designed for tailoring businesses, providing:
              </p>

              <div>
                <p className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Core Features:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Client management and contact database</li>
                  <li>Measurement tracking and storage</li>
                  <li>Session and order management with status tracking</li>
                  <li>Task management and workflow organization</li>
                  <li>Query and communication tracking</li>
                  <li>Fabric inventory management (optional module)</li>
                  <li>Website integration for customer inquiries (optional module)</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Technical Infrastructure:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Secure cloud hosting (EU-based)</li>
                  <li>Mobile-responsive web application</li>
                  <li>Data encryption and backup systems</li>
                  <li>GDPR-compliant data processing</li>
                </ul>
              </div>

              <p className="italic">
                The Service is provided on a subscription basis with pricing determined by the scope of features and services as specified in individual Service Agreements.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">4. Pricing and Payment Terms</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">4.1 Service Fees</h3>
                <p className="mb-2">
                  Tailor Notebook is provided on a paid subscription basis. Fees are determined based on the scope of service and are specified in the individual Service Agreement signed by each controller.
                </p>
                <p className="font-medium mb-1">Typical fee structure includes:</p>
                <div className="ml-4 space-y-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-[#E8EAE7]">Setup Fee (One-time):</p>
                    <p className="text-sm">System configuration, data migration, customization, training, and 30 days intensive support</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-[#E8EAE7]">Monthly Subscription Fee:</p>
                    <p className="text-sm">Hosting, security updates, maintenance, technical support, and data backup</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">4.2 Payment Schedule</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Initial payment upon agreement signing</li>
                  <li>Final setup payment upon system delivery</li>
                  <li>Monthly subscription payments beginning 30 days after go-live</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">4.3 Late Payments</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Late fee: <span className="font-medium">2% per month</span> for invoices unpaid 14+ days overdue</li>
                  <li>Service may be suspended after 30 days</li>
                  <li>Account may be terminated after 60 days with written notice</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">4.4 Price Changes</h3>
                <p>Controllers receive <span className="font-medium">30 days written notice</span> of price changes and may terminate without penalty if they do not accept new pricing.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">4.5 Refund Policy</h3>
                <p className="mb-2"><span className="font-medium">Setup Fees:</span> Refundable in full if cancelled before work begins; non-refundable once development commences</p>
                <p><span className="font-medium">Monthly Subscription:</span> Non-refundable once billing period begins</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">5. User Accounts</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Account Registration</h3>
                <p className="mb-2">Users must provide accurate information, maintain current contact details, create secure passwords, and accept these Terms and the Privacy Policy.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Account Security</h3>
                <p className="mb-2">Users must:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Keep login credentials secure and confidential</li>
                  <li>Not share account access with unauthorized individuals</li>
                  <li>Use strong passwords and change them periodically</li>
                  <li>Notify processor immediately of unauthorized access</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Account Termination</h3>
                <p className="mb-2">Processor may suspend or terminate accounts for:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Violation of these Terms</li>
                  <li>Non-payment</li>
                  <li>Security threats or malicious activity</li>
                  <li>Fraudulent or illegal use</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">6. Access and Availability</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <p><span className="font-medium">Uptime goal:</span> 99% availability (excluding scheduled maintenance)</p>
              <p><span className="font-medium">Scheduled maintenance:</span> Announced 48 hours in advance when possible, conducted during low-usage periods, expected to last no more than 4 hours</p>
              <p><span className="font-medium">Browser compatibility:</span> Optimized for modern browsers (Chrome, Firefox, Safari, Edge) on desktop, tablet, and mobile devices</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">7. Responsibilities of the Controller (Tailor)</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <p>As the Data Controller for client information, the tailoring business agrees to:</p>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Lawful Use</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Use the Service only for lawful purposes</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Not violate others' rights or engage in illegal activities</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">GDPR Compliance</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Inform clients that their data is stored in Tailor Notebook</li>
                  <li>Obtain required permissions or consent for data collection</li>
                  <li>Determine lawful basis for processing client data</li>
                  <li>Respond to data subject requests (access, correction, deletion, etc.)</li>
                  <li>Maintain appropriate privacy notices for clients</li>
                  <li>Notify supervisory authority (IMY in Sweden) of breaches when required</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Data Accuracy and Retention</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Ensure accuracy and completeness of data entered</li>
                  <li>Update information promptly when changes occur</li>
                  <li>Determine appropriate retention periods for client data</li>
                  <li>Delete or archive data when no longer needed</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Security Practices</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Keep login credentials secure</li>
                  <li>Limit account access to authorized personnel only</li>
                  <li>Train staff on proper data handling procedures</li>
                  <li>Report security incidents or suspicious activity promptly</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">8. Responsibilities of the Processor (Tailor Notebook)</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <p>As the Data Processor, Tailor Notebook agrees to:</p>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Processing Instructions</h3>
                <p className="mb-2">Process personal data only on documented instructions from the controller, including:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>These Terms of Service</li>
                  <li>The Service Agreement</li>
                  <li>Email or written requests from authorized administrators</li>
                  <li>In-app actions by authorized users</li>
                  <li>Data Processing Agreement (DPA) provisions</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Security Measures</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Encryption in transit (TLS 1.3/HTTPS) and at rest (AES-256)</li>
                  <li>Role-based access controls</li>
                  <li>Secure authentication and session management</li>
                  <li>Regular security updates and patches</li>
                  <li>Intrusion detection and monitoring</li>
                  <li>Secure backup procedures</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Sub-Processor Management</h3>
                <p>Use only authorized sub-processors meeting GDPR standards. Notify controllers 30 days before sub-processor changes.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Breach Notification</h3>
                <p>Notify controller without undue delay (target: within 24 hours) of any personal data breach, providing all relevant technical information.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">9. Data Ownership</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Controller's Data</h3>
                <p className="mb-2">The controller retains <span className="font-medium">full ownership</span> of all client data, business information, order records, and content uploaded or created.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Processor's Property</h3>
                <p>Tailor Notebook retains ownership of platform source code, software design, documentation, and branding.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">License Grant</h3>
                <p>Controller receives a <span className="font-medium">non-exclusive, non-transferable license</span> to use Tailor Notebook during the subscription period.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Data Portability</h3>
                <p>Controller may export all data in standard formats (CSV, JSON, Excel) at no additional charge upon termination or request.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">10. Data Protection and GDPR Compliance</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <p>The relationship between controller and processor is governed by a Data Processing Agreement (DPA) included in the Service Agreement.</p>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Sub-Processors</h3>
                <div className="bg-gray-50 dark:bg-[#13171B] p-4 rounded-lg border border-gray-200 dark:border-[#2A3136]">
                  <p className="font-medium mb-2">Currently authorized sub-processor:</p>
                  <p className="font-medium">Supabase Inc.</p>
                  <ul className="list-none space-y-1 ml-4 mt-2">
                    <li><span className="font-medium">Purpose:</span> Database hosting, authentication, backup storage</li>
                    <li><span className="font-medium">Location:</span> EU (Stockholm, Sweden)</li>
                    <li><span className="font-medium">Website:</span> supabase.com</li>
                    <li><span className="font-medium">Privacy Policy:</span> <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">https://supabase.com/privacy</a></li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">International Data Transfers</h3>
                <p className="font-medium">All data stored exclusively within the European Union (EU). No international data transfers outside the EU occur.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Data Subject Rights Support</h3>
                <p className="mb-2">Processor provides technical capabilities to assist controllers:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><span className="font-medium">Access:</span> Data export functionality</li>
                  <li><span className="font-medium">Rectification:</span> Edit interfaces for data correction</li>
                  <li><span className="font-medium">Erasure:</span> Deletion functions with permanent removal</li>
                  <li><span className="font-medium">Portability:</span> Export in machine-readable formats (CSV, JSON)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">11. Backups and Security</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Backup Procedures</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><span className="font-medium">Daily automated backups</span> of all data</li>
                  <li><span className="font-medium">30-day backup retention</span> period</li>
                  <li><span className="font-medium">Encrypted backup storage</span> in EU-based data centers</li>
                  <li><span className="font-medium">Redundant backup locations</span> for disaster recovery</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Security Monitoring</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>24/7 security monitoring and intrusion detection</li>
                  <li>Automated security alerts for suspicious activity</li>
                  <li>Regular security assessments and vulnerability scanning</li>
                  <li>Security patch management (critical patches within 7 days)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Controller's Backup Responsibility</h3>
                <p>Controllers are encouraged to export data regularly for local backup purposes and business continuity planning.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">12. Prohibited Use</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p className="font-medium text-gray-900 dark:text-[#E8EAE7]">Users may not:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Store, transmit, or process illegal content</li>
                <li>Enter personal data without appropriate lawful basis</li>
                <li>Process sensitive personal data without explicit consent or legal basis</li>
                <li>Attempt to bypass, circumvent, or disable security controls</li>
                <li>Upload viruses, malware, or malicious code</li>
                <li>Launch denial-of-service attacks or similar disruptions</li>
                <li>Reverse engineer, decompile, or disassemble the software</li>
                <li>Share or sell access to the Service without authorization</li>
              </ul>
              <p className="mt-3 font-medium">Violations may result in immediate account suspension, termination, legal action, and liability for damages.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">13. Service Modifications</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>Tailor Notebook may add features, improve functionality, update the interface, or deprecate outdated features.</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><span className="font-medium">Significant changes</span> (affecting core functionality) are announced at least 30 days in advance when possible</li>
                <li><span className="font-medium">Minor changes</span> (bug fixes, performance improvements) may occur without advance notice</li>
                <li><span className="font-medium">Feature deprecation:</span> Minimum 60 days notice with alternative solutions offered</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">14. Warranties and Limitation of Liability</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Service Commitment</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><span className="font-medium">Uptime:</span> 99% availability goal</li>
                  <li><span className="font-medium">Support response:</span> 24-hour response (weekdays)</li>
                  <li><span className="font-medium">Critical bug fixes:</span> Within 24 hours</li>
                  <li><span className="font-medium">Security patches:</span> Within 7 days</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Limitation of Liability</h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="font-medium mb-2">Maximum Liability:</p>
                  <p className="mb-3">Processor's total liability shall not exceed the total fees paid by the controller in the 12 months immediately preceding the claim.</p>

                  <p className="font-medium mb-2">Excluded Damages:</p>
                  <p>Processor is NOT liable for indirect or consequential damages, lost profits, business interruption, data loss, user errors, client disputes, or third-party service failures.</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">GDPR Liability Exception</h3>
                <p className="font-medium">Processor remains fully responsible for maintaining GDPR-required security measures and data protection obligations as required by law.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Indemnification</h3>
                <p className="mb-2"><span className="font-medium">Controller indemnifies processor</span> for claims arising from:</p>
                <ul className="list-disc list-inside ml-4 space-y-1 mb-3">
                  <li>Controller's violation of these Terms</li>
                  <li>Unlawful data collection or processing by controller</li>
                  <li>Controller's misuse of the Service</li>
                </ul>
                <p className="mb-2"><span className="font-medium">Processor indemnifies controller</span> for claims arising from:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Processor's breach of GDPR obligations</li>
                  <li>Processor's gross negligence or willful misconduct</li>
                  <li>Security breaches caused by processor's failure to implement reasonable safeguards</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">15. Termination</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Termination by Controller</h3>
                <p className="mb-2">Controller may terminate by:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Providing <span className="font-medium">30 days written notice</span></li>
                  <li>Deleting account through account settings (immediate termination)</li>
                </ul>
                <p className="mt-2"><span className="font-medium">Upon termination:</span> All data permanently deleted within 7 days, backups purged within 30 days, outstanding invoices remain due.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Termination by Processor</h3>
                <p className="mb-2">Processor may terminate for:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Non-payment (60 days delinquency with 30 days notice)</li>
                  <li>Terms violations (7 days notice with opportunity to cure)</li>
                  <li>Security threats or illegal activity (immediate suspension possible)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Effect of Termination</h3>
                <p className="mb-2">Upon termination:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>All licenses terminate</li>
                  <li>Access disabled at termination date</li>
                  <li>Data export provided before deletion (if requested)</li>
                  <li>Deletion is irreversible after completion</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Surviving Provisions</h3>
                <p>Data Ownership, Limitation of Liability, Indemnification, Governing Law, and payment obligations survive termination.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">16. Governing Law and Dispute Resolution</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Governing Law</h3>
                <p>These Terms are governed by the laws of <span className="font-medium">Germany</span> and comply with the <span className="font-medium">General Data Protection Regulation (GDPR)</span> and applicable German data protection laws.</p>
                <p className="mt-2">Cross-border services to Sweden are provided in accordance with EU regulations and Swedish data protection requirements.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Jurisdiction</h3>
                <p>Any disputes arising from these Terms shall be resolved in the competent courts of Germany, with jurisdiction determined by the Service Provider's place of residence in accordance with German civil procedure law.</p>
                <p className="mt-2">For Swedish controllers, alternative dispute resolution through the EU Online Dispute Resolution platform (<a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">https://ec.europa.eu/consumers/odr</a>) is also available.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Dispute Resolution Process</h3>
                <p className="mb-2">Before legal proceedings, parties agree to:</p>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  <li><span className="font-medium">Direct Negotiation (30 days):</span> Good-faith discussions to resolve amicably</li>
                  <li><span className="font-medium">Mediation:</span> By mutual agreement (costs shared)</li>
                  <li><span className="font-medium">Legal Proceedings:</span> If negotiation fails</li>
                </ol>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">GDPR Supervisory Authority</h3>
                <p className="mb-3">For data protection matters, controllers and processors may contact:</p>

                <div className="bg-gray-50 dark:bg-[#13171B] p-4 rounded-lg border border-gray-200 dark:border-[#2A3136] mb-3">
                  <p className="font-medium mb-2">Swedish Authority for Privacy Protection (IMY) - For Swedish controllers:</p>
                  <ul className="list-none space-y-1 ml-4">
                    <li><span className="font-medium">Website:</span> imy.se</li>
                    <li><span className="font-medium">Email:</span> imy@imy.se</li>
                    <li><span className="font-medium">Phone:</span> +46 8 657 61 00</li>
                    <li><span className="font-medium">Address:</span> Box 8114, 104 20 Stockholm, Sweden</li>
                  </ul>
                </div>

                <div className="bg-gray-50 dark:bg-[#13171B] p-4 rounded-lg border border-gray-200 dark:border-[#2A3136]">
                  <p className="font-medium mb-2">German Federal Commissioner for Data Protection (BfDI) - For German processor matters:</p>
                  <ul className="list-none space-y-1 ml-4">
                    <li><span className="font-medium">Website:</span> bfdi.bund.de</li>
                    <li><span className="font-medium">Email:</span> poststelle@bfdi.bund.de</li>
                    <li><span className="font-medium">Phone:</span> +49 228 997799-0</li>
                    <li><span className="font-medium">Address:</span> Graurheindorfer Str. 153, 53117 Bonn, Germany</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">17. Changes to Terms</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>Tailor Notebook may modify these Terms to reflect service changes, legal requirements, or business model adjustments.</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><span className="font-medium">Material changes:</span> Communicated via email at least 30 days before taking effect with in-app notification</li>
                <li><span className="font-medium">Right to reject:</span> Controllers may terminate service without penalty within the 30-day notice period if they do not agree with material changes</li>
                <li><span className="font-medium">Continued use</span> after the effective date = acceptance of modified Terms</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">18. Security Logging</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <p>To maintain security and integrity, Tailor Notebook implements essential security logging.</p>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Logged Events</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Authentication events (login attempts, password resets)</li>
                  <li>Access information (IP addresses, timestamps, session duration)</li>
                  <li>Device metadata (browser type, operating system)</li>
                  <li>Account events (creation, modification, deletion)</li>
                  <li>System events (API requests, errors, performance metrics)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Use of Logs</h3>
                <p className="mb-2">Logs used <span className="font-medium">only</span> for:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Security monitoring and incident response</li>
                  <li>System debugging and troubleshooting</li>
                  <li>Performance optimization</li>
                  <li>Fraud prevention</li>
                </ul>
                <p className="mt-2 font-medium">NOT used for user profiling, marketing, or sharing with third parties.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Log Retention</h3>
                <p>Security logs retained for <span className="font-medium">90 days</span>, then automatically deleted.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">19. Personal Data Breaches</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Processor's Obligations</h3>
                <p className="mb-2">If Tailor Notebook becomes aware of a breach, we will:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Notify controller <span className="font-medium">without undue delay</span> (target: within 24 hours)</li>
                  <li>Provide detailed technical information about the incident</li>
                  <li>Describe nature of breach, data affected, and approximate number of records</li>
                  <li>Outline mitigation measures taken</li>
                  <li>Recommend actions for controller</li>
                </ul>
                <p className="mt-2 italic">Complies with GDPR Article 33(2) requirements for processor notification.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Controller's Responsibilities</h3>
                <p className="mb-2">Controller is responsible for:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Assessing risk to affected individuals</li>
                  <li>Notifying IMY (Sweden) within 72 hours where required (GDPR Article 33)</li>
                  <li>Communicating breaches to affected clients when required (GDPR Article 34)</li>
                  <li>Documenting breach response and decisions</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Breach Prevention</h3>
                <p>Processor implements continuous security monitoring, regular assessments, incident response procedures, security training, and encryption safeguards.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">20. Assignment and Transfer</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Controller Assignment</h3>
                <p>Controller may not assign these Terms without written consent, except for business succession (merger, acquisition) with 30 days notice.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Processor Assignment</h3>
                <p>Processor may assign to successor entity or acquiring company. Controllers notified 60 days in advance and may terminate without penalty if they do not agree.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">21. General Provisions</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p><span className="font-medium">Entire Agreement:</span> These Terms, Privacy Policy, Service Agreement, and DPA constitute the entire agreement.</p>
              <p><span className="font-medium">Severability:</span> If any provision is invalid, remaining provisions continue in full force.</p>
              <p><span className="font-medium">Waiver:</span> Failure to enforce any provision does not constitute a waiver.</p>
              <p><span className="font-medium">Relationship:</span> Parties are independent contractors. No employment, partnership, or agency relationship created.</p>
              <p><span className="font-medium">Electronic Signatures:</span> Electronic acceptance (clicking "I agree," creating account) constitutes legally binding signature.</p>
              <p><span className="font-medium">Language:</span> English version controls in case of conflicts with translations.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">22. Contact Information</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <p>For questions, support, or legal matters related to these Terms:</p>

              <div className="bg-gray-50 dark:bg-[#13171B] p-4 rounded-lg border border-gray-200 dark:border-[#2A3136]">
                <p className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Tailor Notebook</p>
                <ul className="list-none space-y-1 ml-4">
                  <li><span className="font-medium">Operated by:</span> Vu Dong Lam Nguyen</li>
                  <li><span className="font-medium">Status:</span> Individual service provider (sole proprietor)</li>
                  <li><span className="font-medium">Address:</span> Lisa-Fittko-Str 5, 10557 Berlin, Germany</li>
                </ul>

                <p className="font-medium text-gray-900 dark:text-[#E8EAE7] mt-3 mb-2">Contact Methods:</p>
                <ul className="list-none space-y-1 ml-4">
                  <li><span className="font-medium">Email:</span> lam.vudongnguyen@gmail.com</li>
                  <li><span className="font-medium">Phone:</span> +49 15257431776</li>
                </ul>

                <p className="font-medium text-gray-900 dark:text-[#E8EAE7] mt-3 mb-2">Response Times:</p>
                <ul className="list-none space-y-1 ml-4">
                  <li>Technical support: Within 24 hours (weekdays)</li>
                  <li>Legal/privacy matters: Within 5 business days</li>
                  <li>General inquiries: Within 48 hours</li>
                </ul>

                <p className="font-medium text-gray-900 dark:text-[#E8EAE7] mt-3">Business Hours:</p>
                <p className="ml-4">Monday-Friday, 9:00-18:00 CET</p>

                <p className="font-medium text-gray-900 dark:text-[#E8EAE7] mt-3">Emergency Contact (urgent security or breach matters):</p>
                <p className="ml-4">lam.vudongnguyen@gmail.com or +49 15257431776</p>
              </div>
            </div>
          </section>

          <div className="border-t border-gray-200 dark:border-[#2A3136] pt-6 mt-8">
            <p className="text-center text-sm text-gray-600 dark:text-[#B7BAAE] italic mb-3">
              By using Tailor Notebook, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and the Privacy Policy.
            </p>
            <p className="text-center text-xs text-gray-500 dark:text-[#858585]">
              Last updated: December 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
