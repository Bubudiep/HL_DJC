import React, { Suspense, useEffect, useState } from "react";
import { List, Page, Icon, useNavigate } from "zmp-ui";
import UserCard from "../components/user-card";
import api from "zmp-sdk";
import { useLocation } from "react-router-dom";

const HomePage = () => {
  const location = useLocation();
  const [user, setUser] = useState(location.state?.user || null); // Đếm số lần thử lại
  const navigate = useNavigate();
  const handleUserUpdate = (updatedUserInfo) => {
    setUser((prevUser) => ({
      ...prevUser,
      zalo: updatedUserInfo?.userInfo, // Cập nhật thông tin Zalo
    }));
  };
  useEffect(() => {
    console.log(location);
    if (user == null) {
      api.getUserInfo({
        success: (data) => {
          const zalo_id = data.userInfo.id;
          console.log("Thông tin người dùng:", data);
          const url = `https://ipays.vn/api/zlogin/`;
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
              const url = `https://ipays.vn/api/danhsachadmin/`;
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
    }
  }, []); // Chạy 1 lần khi component mount
  return (
    <Page className="page">
      <Suspense>
        <div className="section-container">
          <UserCard onUserUpdate={handleUserUpdate} />
        </div>
        <div className="section-container">
          {user?.app?.access_token && user?.zalo?.name ? (
            <List>
              <List.Item
                onClick={() => navigate("/chamcong", { state: { user } })}
              >
                <div>
                  <i className="fa-regular fa-calendar-check"></i> Chấm công
                </div>
                <div className="icons">
                  <i className="fa-solid fa-arrow-right"></i>
                </div>
              </List.Item>
              <List.Item
                onClick={() => navigate("/baocao", { state: { user } })}
              >
                <div>
                  <i className="fa-solid fa-chart-simple"></i> Báo cáo
                </div>
                <div className="icons">
                  <i className="fa-solid fa-arrow-right"></i>
                </div>
              </List.Item>
              <List.Item
                onClick={() => navigate("/config", { state: { user } })}
              >
                <div>
                  <i className="fa-solid fa-gears"></i> Chia ca
                </div>
                <div className="icons">
                  <i className="fa-solid fa-arrow-right"></i>
                </div>
              </List.Item>
            </List>
          ) : (
            <>
              Bạn không có quyền, vui lòng chụp ảnh màn hình và gửi cho quản lý!
            </>
          )}
        </div>
      </Suspense>
    </Page>
  );
};

export default HomePage;
