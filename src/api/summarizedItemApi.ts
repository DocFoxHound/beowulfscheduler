import axios from 'axios';
import { SummarizedItem } from '../types/items_summary';


const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

export const getSummarizedItems = async (): Promise<SummarizedItem> => {
  const response = await axios.get<SummarizedItem>(`${API_BASE_URL}/api/uex/summarizedcommodities/`);
  return response.data;
};

// async function getAllSummarizedCommodities() {
//     const apiUrl = `${process.env.SERVER_URL}${process.env.API_EXP_GER}/summarizedcommodities/`;
//     try {
//         const response = await axios.get(apiUrl);
//         return response.data;  // This will be the return value of the function
//     } catch (error) {
//         console.error('Error fetching entity:', error.response ? error.response.data : error.message);
//         return null;  // Return null if there's an error
//     }
// }

// async function getSummarizedCommodityById(id){
//     const apiUrl = process.env.SERVER_URL;
//     try {
//         const response = await axios.get(`${apiUrl}${process.env.API_EXP_GER}/summarizedcommodities/${id}`);
//         return response.data;  // This now properly returns the response data to the caller
//     } catch (error) {
//         return null;  // Return null or throw an error, depending on how you want to handle errors
//     }
// }