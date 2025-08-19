from flask import Flask, render_template_string, request, jsonify, render_template, send_from_directory
from flask_mysqldb import MySQL
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import pymysql
import MySQLdb.cursors
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://127.0.0.1:5500", "http://localhost:5500"]}})

# ==== CONFIG ====
app.config['MYSQL_HOST']     = os.getenv('MYSQL_HOST')
app.config['MYSQL_USER']     = os.getenv('MYSQL_USER')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD')
app.config['MYSQL_DB']       = os.getenv('MYSQL_DB')

# Upload folders
app.config['LOST_UPLOAD_FOLDER']  = 'static/uploads/lost'
app.config['FOUND_UPLOAD_FOLDER'] = 'static/uploads/found'
os.makedirs(app.config['LOST_UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['FOUND_UPLOAD_FOLDER'], exist_ok=True)

mysql = MySQL(app)

# Example route -------------------------------------------------------
@app.route('/')
def home():
    return "Flask server is running! <p>⚠️ Reminder: Make sure to open your HTML project in Live Server! To display your project </p> <br>" \
           "Remeber every time you have to run both Flask and Html to represent you project because both are separately managed"

# 404 error handler
@app.errorhandler(404)
def page_not_found(e):
    # This message will show whenever a 404 occurs
    return render_template_string('''
        <h1>404 Not Found</h1>
        <p>⚠️ Reminder: Make sure to open your HTML project in Live Server!</p>
        <p>URL: <a href="http://127.0.0.1:5500">http://127.0.0.1:5500</a></p>
    '''), 404
#------------------------------------------------------------------------

# ==== STATIC IMAGE ROUTE ====
@app.route('/static/uploads/<folder>/<filename>')
def uploaded_file(folder, filename):
    return send_from_directory(f'static/uploads/{folder}', filename)

# ==== LOST ITEM ROUTES ====
@app.route("/report-lost-item", methods=["POST"])
def report_lost_item():
    try:
        # Load variables from .env
        load_dotenv()

        conn = pymysql.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            cursorclass=pymysql.cursors.DictCursor
        )
        cursor = conn.cursor()

        # --- Item Details ---
        item_name        = request.form.get("itemName", "").strip()
        user_id          = request.form.get("user_id", "").strip()        # string
        category         = request.form.get("category", "").strip()
        lost_date        = request.form.get("lostDate", "").strip()
        lost_location    = request.form.get("lostLocation", "").strip()
        item_description = request.form.get("itemDescription", "").strip()

        # --- Coordinates ---
        latitude  = request.form.get("latitude", type=float)
        longitude = request.form.get("longitude", type=float)

        # --- Contact Details ---
        contact_name  = request.form.get("contactName", "").strip()
        contact_email = request.form.get("contactEmail", "").strip()
        contact_phone = request.form.get("contactPhone", "").strip()

        # --- Image Upload ---
        image_path = ""
        if "itemImage" in request.files:
            image = request.files["itemImage"]
            if image and image.filename:
                fn      = secure_filename(image.filename)
                dest    = os.path.join(app.config["LOST_UPLOAD_FOLDER"], fn)
                image.save(dest)
                image_path = f"static/uploads/lost/{fn}"

        # --- Validate user_id ---
        if not user_id:
            return jsonify({"status": "error", "message": "Missing user_id"}), 400

        # --- Insert into DB ---
        cursor.execute("""
            INSERT INTO lost_items (
                user_id, item_name, category, lost_date,
                lost_location, item_description,
                contact_name, contact_email, contact_phone,
                image_path, latitude, longitude
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id, item_name, category, lost_date,
            lost_location, item_description,
            contact_name, contact_email, contact_phone,
            image_path, latitude, longitude
        ))
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "success", "message": "Lost item reported successfully!"}), 201

    except Exception as e:
        app.logger.exception("Error (lost): %s", e)
        return jsonify({"status": "error", "message": "Error while reporting lost item."}), 500

@app.route("/get-lost-items", methods=["GET"])
def get_lost_items():
    try:
        # Load variables from .env
        load_dotenv()

        conn = pymysql.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            cursorclass=pymysql.cursors.DictCursor
        )
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM lost_items ORDER BY lost_date DESC")
        items = cursor.fetchall()
        cursor.close()
        conn.close()

        for it in items:
            if it.get("image_path"):
                it["image_path"] = f"http://127.0.0.1:5000/{it['image_path']}"

        return jsonify(items)

    except Exception as e:
        app.logger.exception("Error (fetch lost): %s", e)
        return jsonify({"status": "error", "message": "Failed to fetch lost items."}), 500

# ==== FOUND ITEM ROUTES ====
@app.route('/submit-found-item', methods=['POST'])
def submit_found_item():
    try:
        data = request.form

        # --- Retrieve fields ---
        user_id      = data.get('user_id', '').strip()         # string now
        item_name    = data.get('itemName')
        category     = data.get('category')
        date_found   = data.get('dateFound')
        location     = data.get('locationName')
        description  = data.get('itemDescription')
        finder_name  = data.get('finderName')
        phone        = data.get('phoneNumber')
        alt_phone    = data.get('altPhoneNumber')
        email        = data.get('email')
        address      = data.get('address')

        # --- Validate user_id ---
        if not user_id:
            return jsonify({"status": "error", "message": "Missing user_id"}), 400

        # --- Parse coords ---
        try:
            latitude  = float(data.get('latitude', 0))
            longitude = float(data.get('longitude', 0))
        except ValueError:
            return jsonify({"status": "error", "message": "Invalid coordinates"}), 400

        # --- Image Upload ---
        image_path = ''
        if 'itemImage' in request.files:
            image = request.files['itemImage']
            if image and image.filename:
                fn   = secure_filename(image.filename)
                dest = os.path.join(app.config['FOUND_UPLOAD_FOLDER'], fn)
                image.save(dest)
                image_path = f"static/uploads/found/{fn}"

        # --- Insert into DB ---
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cur.execute("""
            INSERT INTO found_items (
                user_id, item_name, category, date_found, location_name,
                latitude, longitude, description, image_path,
                finder_name, phone, alt_phone, email, address
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id, item_name, category, date_found, location,
            latitude, longitude, description, image_path,
            finder_name, phone, alt_phone, email, address
        ))
        mysql.connection.commit()
        cur.close()

        return jsonify({"status": "success", "message": "Found item submitted successfully!"}), 200

    except Exception as e:
        app.logger.exception("Error (found): %s", e)
        return jsonify({"status": "error", "message": "Failed to submit found item."}), 500

@app.route("/api/found-items", methods=["GET"])
def get_found_items():
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cur.execute("SELECT * FROM found_items ORDER BY date_found DESC")
        items = cur.fetchall()
        cur.close()

        for it in items:
            if it.get("image_path"):
                it["image_path"] = f"http://127.0.0.1:5000/{it['image_path']}"

        return jsonify(items)

    except Exception as e:
        app.logger.exception("Error (get found items): %s", e)
        return jsonify({"status": "error", "message": "Failed to fetch found items."}), 500

@app.route("/found-items-page")
def found_items_page():
    return render_template("found-items.html")

# ==== SEARCH ROUTE ====
@app.route('/search')
def search_items():
    query = request.args.get('q', '').strip()

    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        wildcard = f"%{query}%"

        cur.execute("""
            SELECT 
                'lost' AS type,
                id,
                item_name      AS title,
                item_description AS description,
                image_path,
                lost_date,
                lost_location,
                contact_name,
                contact_phone,
                contact_email,
                -- no finder info on lost items
                NULL          AS date_found,
                NULL          AS location_name,
                NULL          AS finder_name,
                NULL          AS finder_phone,
                NULL          AS finder_email
            FROM lost_items
            WHERE item_name LIKE %s OR item_description LIKE %s

            UNION ALL

            SELECT
                'found' AS type,
                id,
                item_name    AS title,
                description  AS description,
                image_path,
                -- no lost info on found items
                NULL         AS lost_date,
                NULL         AS lost_location,
                NULL         AS contact_name,
                NULL         AS contact_phone,
                NULL         AS contact_email,
                date_found   AS date_found,
                location_name AS location_name,
                finder_name  AS finder_name,
                phone        AS finder_phone,
                email        AS finder_email
            FROM found_items
            WHERE item_name LIKE %s OR description LIKE %s
        """, (wildcard, wildcard, wildcard, wildcard))

        results = cur.fetchall()
        cur.close()

        # Convert stored image paths to public URLs
        for item in results:
            item['image_url'] = (
                f"http://127.0.0.1:5000/{item['image_path']}"
                if item.get('image_path') else ''
            )

        return jsonify(results)

    except Exception as e:
        app.logger.error("Error in /search: %s", e)
        return jsonify({"status": "error", "message": "Search failed."}), 500


# ==== MATCHED ITEMS ROUTE ====
@app.route('/search_matches')
def search_matches():
    keyword = request.args.get('q', '').lower().strip()

    if not keyword:
        return jsonify([])  # return empty if no keyword

    try:
        # Load variables from .env
        load_dotenv()

        conn = pymysql.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            cursorclass=pymysql.cursors.DictCursor
        )
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM lost_items")
        lost_items = cursor.fetchall()

        cursor.execute("SELECT * FROM found_items")
        found_items = cursor.fetchall()

        matched_items = []

        for lost in lost_items:
            for found in found_items:
                # Match category
                if lost['category'].lower() != found['category'].lower():
                    continue

                # Check similarity
                name_match = lost['item_name'].lower() in found['item_name'].lower() or \
                             found['item_name'].lower() in lost['item_name'].lower()

                description_match = lost['item_description'].lower() in found['description'].lower() or \
                                    found['description'].lower() in lost['item_description'].lower()

                if name_match or description_match:
                    # Now filter by keyword relevance
                    combined_text = (
                        lost['item_name'] + " " + lost['item_description'] + " " +
                        found['item_name'] + " " + found['description'] + " " +
                        lost.get('lost_location', '') + " " + found.get('location_name', '')
                    ).lower()

                    if keyword in combined_text:
                        matched_items.append({
                            "lost_id": lost['id'],
                            "lost_name": lost['item_name'],
                            "lost_description": lost['item_description'],
                            "lost_image": f"http://127.0.0.1:5000/{lost['image_path']}",
                            "lost_location": lost.get('lost_location', ''),
                            "lost_date": lost.get('lost_date', ''),
                            "contact_name": lost.get('contact_name', ''),
                            "contact_phone": lost.get('contact_phone', ''),

                            "found_id": found['id'],
                            "found_name": found['item_name'],
                            "found_description": found['description'],
                            "found_image": f"http://127.0.0.1:5000/{found['image_path']}",
                            "location_name": found.get('location_name', ''),
                            "date_found": found.get('date_found', ''),
                            "finder_name": found.get('finder_name', ''),
                            "phone": found.get('phone', '')
                        })

        cursor.close()
        conn.close()

        return jsonify(matched_items)

    except Exception as e:
        print("Error in match search:", e)
        return jsonify({"status": "error", "message": "Failed to find matches."}), 500


@app.route('/user-profile')
def user_profile():
    user_id = request.args.get('user_id', '').strip()
    if not user_id:
        return jsonify({"status": "error", "message": "Missing user_id"}), 400

    cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cur.execute("SELECT * FROM lost_items WHERE user_id = %s", (user_id,))
    lost_items = cur.fetchall()

    cur.execute("SELECT * FROM found_items WHERE user_id = %s", (user_id,))
    found_items = cur.fetchall()
    cur.close()

    return jsonify({
        "status": "success",
        "lost_items": lost_items,
        "found_items": found_items
    })


@app.route('/delete-item/<item_type>/<int:item_id>', methods=['DELETE'])
def delete_item(item_type, item_id):
    table = 'lost_items' if item_type == 'lost' else 'found_items'
    cursor = mysql.connection.cursor()
    cursor.execute(f"DELETE FROM {table} WHERE id = %s", (item_id,))
    mysql.connection.commit()
    return jsonify({'success': True})

# ==== MAIN ====
if __name__ == "__main__":
    app.run(debug=True, port=5000)