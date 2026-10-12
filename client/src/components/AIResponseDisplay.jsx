import AIReport from './AIReport';

// Native tool results and saved detail views use the same structured report renderer.
export default function AIResponseDisplay({ response, title = 'AI Analysis' }) {
  return <AIReport response={response} title={title} />;
}
