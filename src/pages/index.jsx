import React, { Suspense, useEffect, useState } from "react";
import { List, Page, Icon, useNavigate } from "zmp-ui";
import UserCard from "../components/user-card";
import api from "zmp-sdk";

const HomePage = () => {
  const [user, setUser] = useState(null); // Đếm số lần thử lại
  const navigate = useNavigate();
  // Lấy thông tin người dùng khi component được mount
  useEffect(() => {
    api.getUserInfo({
      success: (data) => {
        const zalo_id = data.userInfo.id;
        console.log("Thông tin người dùng:", data);
        const url = `http://localhost:5005/api/zlogin/`;
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            zalo_id: zalo_id, // Gửi zalo_id trong body của yêu cầu
          }),
        })
          .then((response) => {
            console.log(response);
            return response.json();
          })
          .then((app_data) => {
            const url = `http://localhost:5005/api/danhsachadmin/`;

            fetch(url, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${app_data.access_token}`,
              },
            })
              .then((response) => response.json())
              .then((datacongty) => {
                setUser({
                  zalo: data.userInfo,
                  app: app_data,
                  congty: datacongty.results[0],
                });
                // Xử lý dữ liệu sau khi nhận từ API
              })
              .catch((error) => {
                console.error("Lỗi khi gọi API:", error);
              });
            console.log("Đăng nhập thành công:", app_data);
            // Xử lý dữ liệu sau khi nhận từ API
          })
          .catch((error) => {
            console.error("Lỗi khi đăng nhập:", error);
          });
      },
      fail: (error) => {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
      },
    });
  }, []); // Chạy 1 lần khi component mount
  return (
    <Page className="page">
      <Suspense>
        <div className="section-container">
          <UserCard />
        </div>
        <div className="section-container">
          {user?.app?.access_token ? (
            <List>
              <List.Item
                onClick={() => navigate("/dilam", { state: { user } })}
                suffix={<Icon icon="zi-arrow-right" />}
              >
                <div>Chấm công đi làm</div>
              </List.Item>
              <List.Item
                onClick={() => navigate("/dive", { state: { user } })}
                suffix={<Icon icon="zi-arrow-right" />}
              >
                <div>Chấm công đi về</div>
              </List.Item>
            </List>
          ) : (
            <>Bạn không có quyền</>
          )}
        </div>
      </Suspense>
    </Page>
  );
};

export default HomePage;
