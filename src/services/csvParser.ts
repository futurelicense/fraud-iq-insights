import Papa from 'papaparse';
import { ClaimData } from '../types/fraud';

export class CSVParser {
  static requiredHeaders = [
    'Claim_ID',
    'Claimant_ID', 
    'Name',
    'DOB',
    'SSN_Hash',
    'Email',
    'Phone',
    'IP_Address',
    'Device_ID',
    'Employer_Name',
    'Employment_Status',
    'Wage_Reported',
    'Claim_Amount',
    'Claim_Date'
  ];

  static parseCSV(file: File): Promise<ClaimData[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const data = results.data as any[];
            
            // Validate headers
            if (data.length === 0) {
              throw new Error('CSV file is empty');
            }
            
            const headers = Object.keys(data[0]);
            const missingHeaders = this.requiredHeaders.filter(
              header => !headers.includes(header)
            );
            
            if (missingHeaders.length > 0) {
              throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
            }
            
            // Validate and clean data
            const validatedData = data.map((row, index) => {
              const cleanedRow: ClaimData = {
                Claim_ID: String(row.Claim_ID || '').trim(),
                Claimant_ID: String(row.Claimant_ID || '').trim(),
                Name: String(row.Name || '').trim(),
                DOB: String(row.DOB || '').trim(),
                SSN_Hash: String(row.SSN_Hash || '').trim(),
                Email: String(row.Email || '').trim(),
                Phone: String(row.Phone || '').trim(),
                IP_Address: String(row.IP_Address || '').trim(),
                Device_ID: String(row.Device_ID || '').trim(),
                Employer_Name: String(row.Employer_Name || '').trim(),
                Employment_Status: String(row.Employment_Status || '').trim(),
                Wage_Reported: String(row.Wage_Reported || '0').trim(),
                Claim_Amount: String(row.Claim_Amount || '0').trim(),
                Claim_Date: String(row.Claim_Date || '').trim(),
                Justification_Text: String(row.Justification_Text || '').trim()
              };
              
              // Basic validation
              if (!cleanedRow.Claim_ID) {
                throw new Error(`Row ${index + 1}: Missing Claim_ID`);
              }
              
              return cleanedRow;
            });
            
            resolve(validatedData);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }

  static generateSampleCSV(): string {
    const sampleData = [
      {
        Claim_ID: 'CLM-2024-001',
        Claimant_ID: 'USR-789123',
        Name: 'John Smith',
        DOB: '1985-03-15',
        SSN_Hash: 'a1b2c3d4e5f6',
        Email: 'john.smith@email.com',
        Phone: '555-123-4567',
        IP_Address: '192.168.1.100',
        Device_ID: 'dev-abc123',
        Employer_Name: 'TechCorp Industries',
        Employment_Status: 'Terminated',
        Wage_Reported: '850',
        Claim_Amount: '425',
        Claim_Date: '2024-01-15',
        Justification_Text: 'Position eliminated due to company restructuring'
      },
      {
        Claim_ID: 'CLM-2024-002',
        Claimant_ID: 'USR-456789',
        Name: 'Sarah Johnson',
        DOB: '1990-07-22',
        SSN_Hash: 'x9y8z7w6v5u4',
        Email: 'sarah.tempmail@10minutemail.com',
        Phone: '555-999-9999',
        IP_Address: '10.0.0.1',
        Device_ID: 'dev-xyz789',
        Employer_Name: 'Global Solutions LLC',
        Employment_Status: 'Laid Off',
        Wage_Reported: '600',
        Claim_Amount: '2500',
        Claim_Date: '2024-01-16',
        Justification_Text: 'Lost job due to company downsizing'
      },
      {
        Claim_ID: 'CLM-2024-003',
        Claimant_ID: 'USR-321654',
        Name: 'Michael Brown',
        DOB: '1988-11-08',
        SSN_Hash: 'p9o8i7u6y5t4',
        Email: 'mbrown@company.com',
        Phone: '312-555-7890',
        IP_Address: '203.45.67.89',
        Device_ID: 'dev-mno456',
        Employer_Name: 'Manufacturing Co',
        Employment_Status: 'Reduced Hours',
        Wage_Reported: '720',
        Claim_Amount: '360',
        Claim_Date: '2024-01-17',
        Justification_Text: 'Hours reduced from full-time to part-time due to decreased demand'
      },
      {
        Claim_ID: 'CLM-2024-004',
        Claimant_ID: 'USR-987654',
        Name: 'Emily Davis',
        DOB: '1992-05-30',
        SSN_Hash: 'z1x2c3v4b5n6',
        Email: 'emily.davis@tempmail.net',
        Phone: '555-888-7777',
        IP_Address: '10.0.0.1',
        Device_ID: 'dev-xyz789',
        Employer_Name: 'QuickCash Services',
        Employment_Status: 'Terminated',
        Wage_Reported: '1200',
        Claim_Amount: '600',
        Claim_Date: '2024-01-18',
        Justification_Text: 'Fired for attendance issues'
      },
      {
        Claim_ID: 'CLM-2024-005',
        Claimant_ID: 'USR-135792',
        Name: 'Robert Wilson',
        DOB: '1980-12-12',
        SSN_Hash: 'q9w8e7r6t5y4',
        Email: 'rwilson@legitcompany.com',
        Phone: '444-222-3333',
        IP_Address: '192.168.1.200',
        Device_ID: 'dev-legit001',
        Employer_Name: 'Established Corp',
        Employment_Status: 'Laid Off',
        Wage_Reported: '950',
        Claim_Amount: '475',
        Claim_Date: '2024-01-19',
        Justification_Text: 'Department closure due to budget cuts and strategic reorganization'
      }
    ];

    const headers = [
      'Claim_ID',
      'Claimant_ID',
      'Name',
      'DOB',
      'SSN_Hash',
      'Email',
      'Phone',
      'IP_Address',
      'Device_ID',
      'Employer_Name',
      'Employment_Status',
      'Wage_Reported',
      'Claim_Amount',
      'Claim_Date',
      'Justification_Text'
    ];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => 
        headers.map(header => {
          const value = (row as any)[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }
}
