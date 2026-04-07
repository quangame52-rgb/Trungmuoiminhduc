import { Product, Feature } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 'trung-muoi-le',
    name: 'Trứng Muối Ăn Liền Minh Đức',
    description: 'Trứng vịt muối chín sẵn, bóc vỏ ăn ngay. Lòng đỏ bùi béo, thơm ngon, không tanh.',
    price: 12000,
    image: 'https://images.unsplash.com/photo-1587486914432-03d1fef21473?auto=format&fit=crop&q=80&w=800',
    category: 'instant',
    weight: '60g'
  },
  {
    id: 'hu-trung-muoi',
    name: 'Hũ Trứng Muối Cao Cấp (10 quả)',
    description: 'Hũ nhựa cao cấp có quai xách, thắt nơ sang trọng. Thích hợp làm quà biếu lễ tết.',
    price: 115000,
    image: 'https://images.unsplash.com/photo-1598965402089-897ce52e8355?auto=format&fit=crop&q=80&w=800',
    category: 'gift',
    weight: '650g'
  },
  {
    id: 'tui-luoi-trung-muoi',
    name: 'Túi Lưới Trứng Muối (5 quả)',
    description: 'Tiết kiệm và tiện lợi cho gia đình. Trứng được tuyển chọn kỹ lưỡng, kích thước đồng đều.',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&q=80&w=800',
    category: 'instant',
    weight: '300g'
  },
  {
    id: 'long-do-trung-muoi',
    name: 'Lòng Đỏ Trứng Muối Hút Chân Không',
    description: 'Lòng đỏ trứng muối đã tách lòng trắng, hút chân không. Chuyên dùng làm nhân bánh trung thu, bánh bao, xốt trứng muối.',
    price: 85000,
    image: 'https://images.unsplash.com/photo-1582450871972-ab5ca641643d?auto=format&fit=crop&q=80&w=800',
    category: 'raw',
    weight: '200g'
  }
];

export const FEATURES: Feature[] = [
  {
    title: 'Trứng Vịt Thả Đồng',
    description: 'Nguồn trứng vịt tươi sạch từ các trang trại chăn thả tự nhiên, đảm bảo lòng đỏ to và đỏ rực.',
    icon: 'Leaf'
  },
  {
    title: 'Công Thức Muối Truyền Thống',
    description: 'Quy trình muối trứng gia truyền giúp trứng có độ mặn vừa phải, vị bùi béo đặc trưng.',
    icon: 'Utensils'
  },
  {
    title: 'Ăn Liền Tiện Lợi',
    description: 'Sản phẩm đã được làm chín bằng công nghệ hiện đại, giữ trọn dinh dưỡng và hương vị.',
    icon: 'Clock'
  },
  {
    title: 'Chứng Nhận HACCP/ISO',
    description: 'Đạt tiêu chuẩn an toàn thực phẩm quốc tế, an tâm tuyệt đối cho sức khỏe gia đình.',
    icon: 'ShieldCheck'
  }
];
