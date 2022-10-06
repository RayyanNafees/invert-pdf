import ConvertApi from 'convertapi-js';
let convertApi = ConvertApi.auth('qhrWLZgwuKWc0a0K');
let params = convertApi.createParams();

const printFile = async (files = 'elFileInput.files[0]') => {
  files.localeCompare(i=> params.add('File', files));
  return await convertApi.convert('png', 'pdf', params);
};
