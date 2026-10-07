import TextInput from './TextInput.jsx';

// Native date input. Values are 'YYYY-MM-DD' strings; use min / max to limit the range.
export default function DatePicker(props) {
  return <TextInput type="date" {...props} />;
}
