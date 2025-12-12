// Translation map for Travel Planner
export const translations = {
  // Validation messages
  'Vui lòng thử lại.': 'Please try again.',
  'Ngày kết thúc phải sau ngày bắt đầu!': 'End date must be after start date!',
  'Không có': 'None',
  'người lớn': 'adults',
  'trẻ em': 'children',
  
  // Generation messages
  'Đang phân tích thông tin và tạo kế hoạch chi tiết cho bạn...': 'Analyzing information and creating detailed plan for you...',
  'Quá trình này có thể mất 20-30 giây. Vui lòng đợi nhé!': 'This may take 20-30 seconds. Please wait!',
  'Đang tạo kế hoạch...': 'Generating plan...',
  
  // Error messages
  'Có lỗi xảy ra khi tạo kế hoạch:': 'Error generating plan:',
  'Vui lòng kiểm tra:': 'Please check:',
  'Vui lòng đăng nhập': 'Please login',
  
  // UI elements
  'Người lớn': 'Adults',
  'Trẻ em': 'Children',
  'Ngân sách tối thiểu': 'Minimum budget',
  'Ngân sách tối đa': 'Maximum budget',
  'Gửi': 'Send',
  'Bắt đầu lại': 'Start over',
  'Xem kế hoạch chi tiết': 'View detailed plan',
  
  // Travel plan page
  'Kế hoạch du lịch Đà Nẵng': 'Da Nang Travel Plan',
  'ngày': 'days',
  'Xác nhận kế hoạch': 'Confirm plan',
  'Chia sẻ': 'Share',
  'Chi phí ước tính': 'Estimated cost',
  'Tổng cộng': 'Total',
  'Dự báo thời tiết': 'Weather forecast',
  'Thông tin chuyến đi': 'Trip information',
  'Số người': 'Number of people',
  'Phong cách': 'Style',
  'Di chuyển': 'Transportation',
  'Chỗ ở': 'Accommodation',
  'Lưu ý:': 'Notes:',
  'Chi phí ước tính': 'Estimated cost',
  'Miễn phí': 'Free',
  'phút đến điểm tiếp theo': 'mins to next location',
  'Chưa có lịch trình chi tiết cho ngày này': 'No detailed schedule for this day yet',
  
  // Activity types
  'Ăn sáng': 'Breakfast',
  'Ăn trưa': 'Lunch',
  'Ăn tối': 'Dinner',
  'Điểm tham quan buổi sáng': 'Morning attraction',
  'Điểm tham quan buổi chiều': 'Afternoon attraction',
  'Nghỉ ngơi, uống cà phê': 'Rest & coffee break'
};

// Function to replace Vietnamese text with English
export function translateText(text: string): string {
  let translated = text;
  for (const [vi, en] of Object.entries(translations)) {
    translated = translated.replace(new RegExp(vi, 'g'), en);
  }
  return translated;
}
