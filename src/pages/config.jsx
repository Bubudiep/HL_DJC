import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Nhanvien_caidat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [usersList, setUsersList] = useState([]);
  const [user, setUser] = useState(location.state?.user);
  const [message, setMessage] = useState(""); // Message for notification (if any)
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // Default to today
  const [searchQuery, setSearchQuery] = useState(""); // Track search query
  const rowRefs = useRef([]); // Use a ref to store references to each row
  const [searchIndex, setSearchIndex] = useState(false);
  const [chuyenca, setchuyenca] = useState(false);

  const [csCa, setCsCa] = useState(false);
  const [notes, setNotes] = useState("");
  const [csCadate, setCsCadate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [shiftFilter, setShiftFilter] = useState("Tất cả");
  useEffect(() => {
    console.log(user);
    fetch("https://ipays.vn/api/danhsachnhanvien/?page_size=999", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.app?.access_token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.results) setUsersList(data.results);
      })
      .catch((error) => {
        console.error("Error when calling API:", error);
      });
  }, [user]);
  const handleSave = (nghiviec = false) => {
    console.log(chuyenca, csCa, csCadate);
    fetch("https://ipays.vn/api/cty/chuyenca/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.app?.access_token}`,
      },
      body: nghiviec
        ? JSON.stringify({
            id: chuyenca.id,
            nghiviec: true,
          })
        : JSON.stringify({
            id: chuyenca.id, // Could be search filters or other data
            calamviec: csCa, // Example: filter by date (you can send more fields as needed)
            ngayapdung: csCadate,
            ghichu: notes,
          }),
    })
      .then((response) => response.json())
      .then((data) => {
        setUsersList((oldList) => {
          const userIndex = oldList.findIndex((user) => user.id === data.id);
          if (userIndex !== -1) {
            const updatedList = [...oldList];
            updatedList[userIndex] = data;
            return updatedList;
          } else {
            // If the user doesn't exist, append the new user to the list
            return [...oldList, data]; // Add the new item to the list
          }
        });
        setchuyenca(false);
      })
      .catch((error) => {
        console.error("Error when calling API:", error);
      });
  };
  // Function to handle search
  const handleSearch = () => {
    const foundIndex = usersList.findIndex((user) => {
      return (
        user?.manhanvien.includes(searchQuery) ||
        user?.HovaTen.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
    if (foundIndex !== -1 && rowRefs.current[foundIndex]) {
      rowRefs.current[foundIndex].scrollIntoView({ behavior: "smooth" });
      setSearchIndex(foundIndex);
    }
  };
  // Filter the users list based on the selected shift
  const filteredUsersList = usersList
    .filter((user) => {
      if (shiftFilter === "Tất cả") return true; // Show all users if no filter
      return user?.calamviec === shiftFilter;
    })
    .sort((a, b) => {
      if (a?.nghiviec === false && b?.nghiviec === true) return -1;
      if (a?.nghiviec === true && b?.nghiviec === false) return 1;
      return 0;
    });
  return (
    <div className="full-page">
      {chuyenca && (
        <div className="popup">
          <div
            className="detectOut"
            onClick={() => {
              setchuyenca(false);
            }}
          ></div>
          <div className="box">
            <div className="title">
              {chuyenca.HovaTen} -{" "}
              {chuyenca?.calamviec == "cangay"
                ? "Ca ngày"
                : user?.calamviec == "cadem"
                ? "Ca đêm"
                : "Chưa cài"}
            </div>
            <div className="body">
              <table>
                <tbody>
                  <tr>
                    <td>Chuyển sang</td>
                    <td>
                      <select
                        value={csCa}
                        onChange={(e) => {
                          setCsCa(e.target.value);
                        }}
                      >
                        <option value={"cangay"}>Ca Ngày</option>
                        <option value={"cadem"}>Ca đêm</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td>Ngày bắt đầu</td>
                    <td>
                      <input
                        type="date"
                        value={csCadate}
                        onChange={(e) => {
                          setCsCadate(e.target.value);
                        }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Ghi chú</td>
                    <td>
                      <textarea
                        value={notes}
                        placeholder="ghi gì đó..."
                        onChange={(e) => {
                          setNotes(e.target.value);
                        }}
                      ></textarea>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="tools">
              <button className="btn-save" onClick={handleSave}>
                Lưu lại
              </button>
              <div className="ml-auto">
                <button
                  onClick={() => {
                    handleSave(true);
                  }}
                  className="btn-close"
                >
                  Nghỉ việc
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="top-container">
        <div className="left">
          <button onClick={() => navigate(-1)}>Quay lại</button>
        </div>
        <div className="right">
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
          >
            <option value="Tất cả">Tất cả</option>
            <option value="cangay">Ca ngày</option>
            <option value="cadem">Ca đêm</option>
          </select>
        </div>
      </div>

      <div className="top-container pt-0">
        <div className="left gap-2 flex">
          <input
            type="text"
            placeholder="Mã nv, họ tên..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            onKeyUp={(e) => {
              handleSearch(); // Trigger search when Enter key is pressed
            }}
          />
          <button onClick={handleSearch}>Tìm kiếm</button>
        </div>
      </div>

      <div className="history no-bot">
        <div className="bar-top">
          <div className="bar"></div>
        </div>
        <div className="title">
          Danh sách nhân viên{" "}
          <div className="count">
            {filteredUsersList.length > 0 &&
              filteredUsersList.filter((item) => item.nghiviec === false)
                .length}
            /{filteredUsersList.length}
          </div>
        </div>
        <div className="list_data">
          <table>
            <tbody>
              {filteredUsersList.map((user, index) => (
                <tr
                  key={index}
                  className={`${searchIndex == index ? "active" : ""}`}
                  ref={(el) => (rowRefs.current[index] = el)}
                >
                  <td className="id">{index + 1}</td>
                  <td className="date">{user?.manhanvien}</td>
                  <td className="user">{user?.HovaTen}</td>
                  <td className="user">
                    {user?.calamviec == "cangay"
                      ? "Ngày"
                      : user?.calamviec == "cadem"
                      ? "Đêm"
                      : "Chưa cài"}
                  </td>
                  <td>
                    {!user.nghiviec ? (
                      <button
                        onClick={() => {
                          setchuyenca(user);
                          if (user?.calamviec == "cangay") {
                            setCsCa("cadem");
                          } else {
                            setCsCa("cangay");
                          }
                        }}
                      >
                        Chuyển ca
                      </button>
                    ) : (
                      "Nghỉ việc"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Nhanvien_caidat;
