export interface NewsHeadline {
    source: 'FDA' | 'EMA' | 'Quartr API' | 'NewsRx' | 'AlphaSense' | 'CDSCO';
    category: 'Regulatory' | 'Clinical Trial' | 'Financial' | 'Safety';
    headline: string;
}

export const mockNewsData: NewsHeadline[] = [
    {
        source: 'FDA',
        category: 'Regulatory',
        headline: 'Wegovy (semaglutide) receives expanded approval for cardiovascular risk reduction in adults with obesity.',
    },
    {
        source: 'EMA',
        category: 'Regulatory',
        headline: 'CHMP recommends granting marketing authorisation for new Alzheimer\'s treatment, pending final EC decision.',
    },
    {
        source: 'Quartr API',
        category: 'Financial',
        headline: 'Novo Nordisk reports Q3 earnings call, raises full-year outlook on strong GLP-1 sales.',
    },
    {
        source: 'NewsRx',
        category: 'Clinical Trial',
        headline: 'Phase III results for Eli Lilly\'s tirzepatide show significant A1C reduction in Type 2 Diabetes patients.',
    },
    {
        source: 'AlphaSense',
        category: 'Financial',
        headline: 'Pfizer announces strategic acquisition of oncology biotech firm Seagen for $43 billion.',
    },
    {
        source: 'FDA',
        category: 'Safety',
        headline: 'New black box warning added to a class of JAK inhibitors regarding increased risk of major adverse cardiovascular events.',
    },
    {
        source: 'EMA',
        category: 'Regulatory',
        headline: 'Orphan Drug Designation granted to BioMarin\'s investigational gene therapy for rare genetic disorder.',
    },
    {
        source: 'CDSCO',
        category: 'Regulatory',
        headline: 'India approves first domestically produced CAR-T cell therapy, NexCAR19, for cancer treatment.',
    },
    {
        source: 'NewsRx',
        category: 'Clinical Trial',
        headline: 'Moderna initiates Phase II trial for combination COVID-19/flu mRNA vaccine.',
    },
    {
        source: 'Quartr API',
        category: 'Financial',
        headline: 'Merck & Co. to host investor call to discuss Keytruda patent cliff and future pipeline strategy.',
    }
];
