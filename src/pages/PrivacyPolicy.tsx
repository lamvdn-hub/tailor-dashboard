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

        <div className="bg-white dark:bg-[#1B1F23] rounded-lg border border-gray-200 dark:border-[#2A3136] p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">1. Introduction</h2>
            <p className="text-gray-700 dark:text-[#B7BAAE]">
              This Privacy Policy explains how Tailor Notebook processes personal data in compliance with the General Data Protection Regulation (GDPR) and Swedish data protection law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">2. Roles and Responsibilities</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <div>
                <p className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Data Controller: The tailoring business using Tailor Notebook.</p>
                <p className="mb-2">The controller determines:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>What client data is collected</li>
                  <li>How long data is kept</li>
                  <li>Lawful basis for processing</li>
                  <li>Responses to GDPR requests from clients</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Data Processor: Tailor Notebook (the service provider).</p>
                <p className="mb-2">The processor handles:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Hosting</li>
                  <li>Storage</li>
                  <li>Technical processing</li>
                  <li>Security safeguards</li>
                  <li>Sub-processor management (Supabase)</li>
                </ul>
              </div>
              <p>A Data Processing Agreement (DPA) governs this relationship.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">3. Personal Data Processed</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">3.1 User Account Data (Tailor + Staff)</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Authentication data</li>
                  <li>Role/permissions</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">3.2 Client Data (Entered by the Tailor)</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Names and contact information</li>
                  <li>Body measurements</li>
                  <li>Session notes and preferences</li>
                  <li>Order history</li>
                  <li>Internal business notes</li>
                </ul>
                <p className="mt-2">The controller must ensure clients are properly informed before their data is stored.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">3.3 Business Data</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Fabric lists</li>
                  <li>Task lists</li>
                  <li>Internal workflow information</li>
                  <li>Customer queries</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">3.4 System Data</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Log data (security, access records)</li>
                  <li>Device and browser metadata (for authentication security)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">4. Legal Basis for Processing</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>The controller determines the lawful basis. Common bases include:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><span className="font-medium">Contractual necessity:</span> Providing tailoring services</li>
                <li><span className="font-medium">Legitimate interest:</span> Managing client records and workflow</li>
                <li><span className="font-medium">Legal obligation:</span> Accounting or record-keeping duties</li>
              </ul>
              <p>The processor acts only on documented instructions from the controller.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">5. Purpose of Processing</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700 dark:text-[#B7BAAE]">
              <li>Managing client information</li>
              <li>Recording measurements and tailoring details</li>
              <li>Tracking tasks, queries, and workflow</li>
              <li>Managing fabrics and internal operations</li>
              <li>Ensuring security and service functionality</li>
            </ul>
            <p className="mt-3 text-gray-700 dark:text-[#B7BAAE]">
              The processor does not use or access this data for any independent purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">6. Data Storage and Security</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>
                Data is stored on Supabase (EU region – Stockholm, Sweden).
              </p>
              <p className="font-medium">Security measures include:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Encryption in transit (HTTPS)</li>
                <li>Encryption at rest</li>
                <li>Role-based access controls</li>
                <li>Secure authentication</li>
                <li>Regular backups and audit logging</li>
              </ul>
              <p>Supabase acts as a sub-processor under the DPA.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">7. Data Sharing</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>Personal data may be shared only with:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Supabase (hosting/authentication)</li>
                <li>Legal authorities, if required by law</li>
              </ul>
              <p>No data is sold or shared with advertisers or third-party marketers.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">8. Data Subject Rights</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>
                Client data belongs to the tailoring business (controller).
                Clients wishing to exercise GDPR rights must contact the tailor. These rights include:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Access</li>
                <li>Rectification</li>
                <li>Erasure</li>
                <li>Restriction</li>
                <li>Portability</li>
                <li>Objection</li>
              </ul>
              <p>Tailor Notebook (processor) supports the controller technically in fulfilling requests.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">9. Data Retention</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>The controller determines how long personal data is retained.</p>
              <p>The processor retains data only:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>As long as the controller's account is active</li>
                <li>As required for security logs and legal compliance</li>
                <li>As instructed by the controller</li>
              </ul>
              <p>Upon account deletion by the controller, all associated data is permanently deleted.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">10. Cookies</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>Tailor Notebook uses only essential cookies for:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Authentication</li>
                <li>Session management</li>
              </ul>
              <p>No tracking, analytics, or advertising cookies are used.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">11. International Transfers</h2>
            <p className="text-gray-700 dark:text-[#B7BAAE]">
              Data is stored exclusively within the EU. No international transfers occur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">12. Children's Privacy</h2>
            <p className="text-gray-700 dark:text-[#B7BAAE]">
              The service is not intended for users under 16. Client data relating to minors must be collected lawfully by the controller.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">13. Changes to This Policy</h2>
            <p className="text-gray-700 dark:text-[#B7BAAE]">
              Material changes will be communicated to users. The "Last updated" date reflects the latest revision.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">14. Contact</h2>
            <div className="space-y-2 text-gray-700 dark:text-[#B7BAAE]">
              <p>
                Data protection inquiries should be directed to the tailoring business (controller).
              </p>
              <p>
                Processor inquiries may be directed to Tailor Notebook support.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">15. Security Logging</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>
                To maintain the security and integrity of the service, Tailor Notebook records essential authentication and system events. These logs are used solely for security, performance, and fraud-prevention purposes.
              </p>
              <p className="font-medium text-gray-900 dark:text-[#E8EAE7]">Logged events may include:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Successful and failed login attempts</li>
                <li>Access timestamps</li>
                <li>Device and browser metadata</li>
                <li>System errors and operational events</li>
              </ul>
              <p>
                Tailor Notebook does not use security logs for profiling or analytics. Logs are retained only as long as necessary for security and compliance purposes.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">16. Personal Data Breaches</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>
                As a Data Processor, Tailor Notebook maintains internal procedures to detect and assess potential personal data breaches.
              </p>
              <p>
                If Tailor Notebook becomes aware of a breach affecting personal data processed on behalf of the tailoring business (the Data Controller), it will notify the controller <span className="font-medium">without undue delay</span>, in accordance with GDPR Article 33(2).
              </p>
              <p className="font-medium text-gray-900 dark:text-[#E8EAE7]">The Data Controller is responsible for:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Assessing the risk to affected individuals</li>
                <li>Notifying the supervisory authority (IMY) where required</li>
                <li>Communicating breaches to affected clients when required</li>
              </ul>
              <p>
                Tailor Notebook supports the controller by providing relevant technical information about the incident.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">17. Data Retention Responsibilities</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>
                The tailoring business (Data Controller) determines how long client data is retained in Tailor Notebook.
              </p>
              <p className="font-medium text-gray-900 dark:text-[#E8EAE7]">Tailor Notebook (Data Processor):</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Stores data only for the duration of the controller's active account</li>
                <li>Deletes all associated data when instructed by the controller or if the account is terminated</li>
                <li>Ensures backups are purged according to the processor's retention schedule</li>
                <li>Provides tools enabling export, erasure, and correction of data</li>
              </ul>
              <p>
                Retention rules and lawful bases are defined solely by the controller.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
