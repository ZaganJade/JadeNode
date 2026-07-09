<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Article\Models\Article;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeds the public-facing knowledge base / news articles that customers
 * read from the landing page ("Artikel" menu) and the /articles pages.
 *
 * Content is published, Indonesian, and themed around the JadeNode
 * marketplace (launch news, product guides, tutorials, security, billing).
 *
 * Idempotent: keyed on slug, so it can be re-run standalone without
 * creating duplicates.
 */
class ArticleSeeder extends Seeder
{
    public function run(): void
    {
        // Attribute articles to the admin (editorial author). Fall back
        // gracefully so the seeder never hard-fails on a fresh database.
        $author = User::where('email', 'admin@jadenode.id')->first()
            ?? User::where('role', 'admin')->first()
            ?? User::first();

        if (! $author) {
            $this->command->warn('ArticleSeeder skipped: no user found. Run UserSeeder first.');

            return;
        }

        foreach ($this->articles() as $data) {
            $slug = Str::slug($data['title']);

            $article = Article::updateOrCreate(
                ['slug' => $slug],
                [
                    'user_id'      => $author->id,
                    'title'        => $data['title'],
                    'excerpt'      => $data['excerpt'],
                    'body'         => $data['body'],
                    'cover_image'  => $data['cover_image'],
                    'category'     => $data['category'],
                    'status'       => 'published',
                    // Explicit: the model's auto word-count understates
                    // Indonesian prose with numbers/code blocks.
                    'reading_time' => $data['reading_time'],
                ],
            );

            // Stagger publish dates so the list reads like a real news feed
            // instead of every article sharing the same seed timestamp.
            $publishedAt = now()->subDays($data['days_ago'])->setTime(9, 30);
            $article->created_at = $publishedAt;
            $article->updated_at = $publishedAt;
            $article->saveQuietly();
        }

        $this->command->info('Seeded ' . count($this->articles()) . ' published articles (author: ' . $author->name . ').');
    }

    /**
     * Article content. Bodies are HTML (rendered by the article detail page).
     *
     * @return array<int, array{title:string,category:string,cover_image:string,days_ago:int,reading_time:int,excerpt:string,body:string}>
     */
    private function articles(): array
    {
        $peluncuran = <<<'HTML'
<p><strong>JadeNode Marketplace</strong> kini resmi tersedia untuk pelanggan di Indonesia. Kami menghadirkan satu tempat untuk menemukan, memesan, dan mengelola infrastruktur cloud — mulai dari Virtual Private Server (VPS) hingga dedicated server bare-metal — dengan harga Rupiah yang transparan dan tanpa biaya tersembunyi.</p>

<h2>Apa itu JadeNode?</h2>
<p>JadeNode adalah marketplace infrastruktur yang dioperasikan langsung oleh <strong>ZaganJade</strong> sebagai penyedia <em>first-party</em>. Artinya, Anda memesan layanan langsung dari operator yang menjalankan dan merawat perangkat kerasnya — bukan reseller. Hasilnya: harga lebih jelas, dukungan lebih cepat, dan tanggung jawab yang jelas atas setiap node yang Anda jalankan.</p>

<h2>Yang Anda dapatkan</h2>
<ul>
  <li><strong>Provisioning cepat</strong> — VPS aktif dalam hitungan menit hingga maksimal 24 jam, sesuai SLA yang tertera di setiap produk.</li>
  <li><strong>Data center Jakarta</strong> — latensi rendah untuk pengguna dan bisnis di Indonesia.</li>
  <li><strong>Harga transparan</strong> — tagihan bulanan atau tahunan dalam Rupiah, lengkap dengan invoice dan riwayat transaksi.</li>
  <li><strong>Perlindungan pelanggan</strong> — provider terverifikasi dan jaminan penyelesaian sengketa di setiap pesanan.</li>
</ul>

<h2>Program Beta Access</h2>
<p>Untuk tahap awal, sebagian fitur lanjutan dibuka melalui <strong>Beta Access</strong>. Daftarkan akun Anda, ajukan akses beta dari dashboard, dan tim kami akan meninjau permohonan tersebut. Setelah disetujui, Anda dapat langsung melakukan deployment pertama.</p>

<blockquote>Misi kami sederhana: membuat infrastruktur cloud kelas produksi dapat diakses siapa saja di Indonesia, tanpa kerumitan dan tanpa kejutan biaya.</blockquote>

<p>Siap memulai? Jelajahi katalog di halaman <a href="/marketplace">Marketplace</a> dan temukan paket yang paling sesuai dengan kebutuhan Anda.</p>
HTML;

        $liniVps = <<<'HTML'
<p>Setiap proyek punya kebutuhan berbeda. Karena itu JadeNode menyediakan empat tier VPS yang dirancang bertingkat — dari lingkungan uji coba ringan hingga beban kerja produksi yang menuntut. Semuanya berjalan di atas penyimpanan SSD/NVMe dan jaringan data center Jakarta.</p>

<h2>Empat tier, satu standar kualitas</h2>
<h3>VPS Starter</h3>
<p>1 vCPU · 1 GB RAM · 20 GB SSD · 1 TB bandwidth. Ideal untuk belajar, pengembangan, bot kecil, atau staging. Mulai dari <strong>Rp50.000/bulan</strong>.</p>
<h3>VPS Basic</h3>
<p>2 vCPU · 2 GB RAM · 40 GB SSD · 2 TB bandwidth. Pas untuk website produksi kecil, blog, atau aplikasi dengan trafik sedang. Mulai dari <strong>Rp100.000/bulan</strong>.</p>
<h3>VPS Pro</h3>
<p>4 vCPU · 8 GB RAM · 80 GB NVMe · 4 TB bandwidth. Bertenaga untuk API, database, dan aplikasi dengan trafik menengah. Mulai dari <strong>Rp250.000/bulan</strong>.</p>
<h3>VPS Enterprise</h3>
<p>8 vCPU · 16 GB RAM · 160 GB NVMe · 8 TB bandwidth. Untuk beban kerja <em>mission-critical</em> dan database berat. Mulai dari <strong>Rp500.000/bulan</strong>.</p>

<h2>Bagaimana memilih?</h2>
<ul>
  <li><strong>Baru mulai / eksperimen</strong> → Starter.</li>
  <li><strong>Website atau aplikasi produksi pertama</strong> → Basic.</li>
  <li><strong>Butuh CPU &amp; RAM lebih untuk API atau database</strong> → Pro.</li>
  <li><strong>Trafik tinggi &amp; tidak boleh down</strong> → Enterprise.</li>
</ul>

<blockquote>Tip: pilih siklus tahunan untuk menghemat — Anda membayar setara 10 bulan untuk pemakaian 12 bulan.</blockquote>

<p>Butuh bare-metal? Lihat juga lini <strong>Dedicated Server</strong> kami untuk hardware eksklusif. Bandingkan semua paket di halaman <a href="/marketplace">Marketplace</a>.</p>
HTML;

        $deploy = <<<'HTML'
<p>Punya VPS baru dan bingung mulai dari mana? Panduan ini membawa Anda dari checkout hingga login SSH pertama dalam beberapa langkah singkat.</p>

<h2>Langkah demi langkah</h2>
<ol>
  <li><strong>Pilih produk.</strong> Buka <a href="/marketplace">Marketplace</a>, pilih paket VPS, lalu tentukan siklus tagihan (bulanan atau tahunan).</li>
  <li><strong>Checkout.</strong> Tambahkan ke keranjang dan selesaikan pesanan. Anda akan menerima invoice yang bisa dibuka kapan saja di dashboard.</li>
  <li><strong>Tunggu provisioning.</strong> Server disiapkan otomatis sesuai SLA produk (umumnya di bawah 24 jam, sering kali jauh lebih cepat). Statusnya bisa dipantau di menu Deployments.</li>
  <li><strong>Tambahkan SSH key.</strong> Buka <em>Settings → SSH Keys</em> dan tempelkan public key Anda agar bisa login tanpa password.</li>
  <li><strong>Login ke server.</strong> Setelah IP aktif, hubungkan lewat terminal:</li>
</ol>

<pre><code>ssh root@IP_SERVER_ANDA</code></pre>

<h2>Setelah masuk</h2>
<p>Hal pertama yang sebaiknya dilakukan adalah memperbarui sistem:</p>
<pre><code>apt update &amp;&amp; apt upgrade -y</code></pre>

<p>Setelah itu Anda siap memasang web server, runtime, atau container sesuai kebutuhan. Aksi seperti restart, rebuild, atau reinstall bisa dijalankan kapan saja melalui panel <strong>Resource Actions</strong>.</p>

<blockquote>Belum punya SSH key? Jangan khawatir — artikel berikutnya membahas cara membuatnya sekaligus mengamankan server Anda.</blockquote>

<p>Mengalami kendala? Tim kami siap membantu melalui menu <strong>Tickets</strong> di dashboard.</p>
HTML;

        $keamanan = <<<'HTML'
<p>Server yang terhubung ke internet akan selalu menjadi target percobaan login otomatis. Kabar baiknya, dengan beberapa langkah dasar Anda bisa menutup hampir semua celah yang umum dieksploitasi.</p>

<h2>1. Gunakan SSH key, bukan password</h2>
<p>Password bisa ditebak; SSH key praktis tidak. Buat pasangan kunci di komputer Anda:</p>
<pre><code>ssh-keygen -t ed25519 -C "nama@email.com"</code></pre>
<p>Salin isi file <code>~/.ssh/id_ed25519.pub</code>, lalu tambahkan melalui <em>Settings → SSH Keys</em> di dashboard JadeNode.</p>

<h2>2. Matikan login password</h2>
<p>Setelah memastikan login dengan key berhasil, nonaktifkan autentikasi password di <code>/etc/ssh/sshd_config</code>:</p>
<pre><code>PasswordAuthentication no
PermitRootLogin prohibit-password</code></pre>
<p>Lalu muat ulang layanan: <code>systemctl reload sshd</code>.</p>

<h2>3. Aktifkan firewall</h2>
<p>Izinkan hanya port yang Anda butuhkan, misalnya SSH dan HTTP/HTTPS:</p>
<pre><code>ufw allow OpenSSH
ufw allow 80,443/tcp
ufw enable</code></pre>

<h2>4. Rajin update &amp; pasang fail2ban</h2>
<ul>
  <li>Jalankan <code>apt update &amp;&amp; apt upgrade</code> secara berkala.</li>
  <li>Pasang <code>fail2ban</code> untuk memblokir IP yang berulang kali gagal login.</li>
  <li>Hindari menjalankan layanan sebagai root bila tidak perlu.</li>
</ul>

<blockquote>Prinsip dasar hardening: kurangi permukaan serangan. Tutup yang tidak dipakai, perbarui yang dipakai, dan pantau sisanya.</blockquote>

<p>Semua kunci SSH yang Anda daftarkan tersimpan aman dan bisa dicabut kapan saja dari dashboard.</p>
HTML;

        $dataCenter = <<<'HTML'
<p>Lokasi server menentukan kecepatan yang dirasakan pengguna Anda. JadeNode menempatkan infrastruktur di <strong>Jakarta</strong> — dekat dengan mayoritas pengguna internet Indonesia — sehingga latensi tetap rendah dan pengalaman terasa instan.</p>

<h2>Mengapa lokasi penting</h2>
<p>Setiap kilometer menambah waktu tempuh data. Hosting di luar negeri bisa menambah puluhan hingga ratusan milidetik pada tiap permintaan. Dengan node di Jakarta, trafik dari Pulau Jawa dan sekitarnya menempuh jarak yang jauh lebih pendek — terasa pada waktu muat halaman, respons API, dan koneksi database.</p>

<h2>Di balik layar</h2>
<ul>
  <li><strong>Penyimpanan NVMe/SSD</strong> — operasi baca-tulis cepat untuk database dan aplikasi.</li>
  <li><strong>Jaringan andal</strong> — bandwidth besar di setiap paket dan konektivitas yang stabil.</li>
  <li><strong>Redundansi</strong> — daya dan jaringan dirancang dengan cadangan untuk meminimalkan gangguan.</li>
</ul>

<h2>Komitmen SLA kami</h2>
<p>Kepercayaan dibangun lewat keandalan. Karena itu setiap produk menyertakan:</p>
<ul>
  <li><strong>SLA provisioning</strong> — server disiapkan dalam tenggat yang dijanjikan (mis. 12–24 jam untuk VPS).</li>
  <li><strong>Provider terverifikasi</strong> — dijalankan langsung oleh operator first-party.</li>
  <li><strong>Perlindungan sengketa</strong> — mekanisme penyelesaian bila pesanan tidak sesuai.</li>
</ul>

<blockquote>Infrastruktur yang baik adalah infrastruktur yang tidak perlu Anda pikirkan. Itulah standar yang kami kejar setiap hari.</blockquote>

<p>Pelajari spesifikasi dan SLA tiap produk langsung di halaman <a href="/marketplace">Marketplace</a>.</p>
HTML;

        $billing = <<<'HTML'
<p>Transparansi biaya adalah salah satu prinsip utama JadeNode. Artikel ini menjelaskan bagaimana siklus tagihan, invoice, dan pembayaran bekerja agar Anda selalu tahu persis apa yang dibayar.</p>

<h2>Siklus tagihan</h2>
<p>Setiap produk tersedia dalam dua siklus:</p>
<ul>
  <li><strong>Bulanan</strong> — fleksibel, dibayar tiap bulan.</li>
  <li><strong>Tahunan</strong> — lebih hemat; Anda umumnya membayar setara 10 bulan untuk 12 bulan pemakaian.</li>
</ul>
<p>Semua harga tercantum dalam <strong>Rupiah (IDR)</strong> dan sudah final di halaman produk — tidak ada biaya tersembunyi.</p>

<h2>Invoice &amp; pembayaran</h2>
<p>Saat memesan, sistem otomatis membuat <strong>invoice</strong>. Anda dapat membukanya di menu <em>Invoices</em> pada dashboard, lengkap dengan rincian item, jumlah, dan statusnya. Setelah pembayaran terkonfirmasi, layanan masuk ke tahap provisioning.</p>

<h2>Riwayat transaksi</h2>
<p>Setiap pembayaran tercatat di menu <em>Transactions</em>. Di sana Anda bisa menelusuri kembali kapan layanan dibeli, diperpanjang, atau diubah — berguna untuk pencatatan dan pelaporan.</p>

<h2>Perpanjangan &amp; masa berlaku</h2>
<ul>
  <li>Layanan aktif selama satu siklus penuh sejak pembayaran.</li>
  <li>Menjelang berakhir, Anda akan diingatkan untuk memperpanjang.</li>
  <li>Memperpanjang tepat waktu menjaga layanan tetap berjalan tanpa gangguan.</li>
</ul>

<blockquote>Aturan kami sederhana: Anda hanya membayar untuk apa yang Anda lihat di halaman produk. Tidak ada kejutan di akhir bulan.</blockquote>

<p>Punya pertanyaan soal tagihan? Buka tiket lewat menu <strong>Tickets</strong> dan tim kami akan membantu.</p>
HTML;

        return [
            [
                'title'       => 'JadeNode Marketplace Resmi Diluncurkan untuk Indonesia',
                'category'    => 'Pengumuman',
                'cover_image' => '/articles/peluncuran-jadenode-marketplace.svg',
                'days_ago'    => 3,
                'reading_time' => 3,
                'excerpt'     => 'JadeNode resmi membuka marketplace infrastruktur cloud — VPS dan dedicated server dengan provisioning cepat, harga Rupiah transparan, dan data center di Jakarta.',
                'body'        => $peluncuran,
            ],
            [
                'title'       => 'Mengenal Lini VPS JadeNode: dari Starter hingga Enterprise',
                'category'    => 'Produk',
                'cover_image' => '/articles/mengenal-lini-vps-jadenode.svg',
                'days_ago'    => 8,
                'reading_time' => 3,
                'excerpt'     => 'Empat tier VPS dengan spesifikasi dan harga transparan. Pelajari perbedaannya dan temukan paket yang paling pas untuk proyek Anda.',
                'body'        => $liniVps,
            ],
            [
                'title'       => 'Panduan: Deploy VPS Pertama Anda di JadeNode',
                'category'    => 'Tutorial',
                'cover_image' => '/articles/panduan-deploy-vps-pertama.svg',
                'days_ago'    => 14,
                'reading_time' => 2,
                'excerpt'     => 'Dari checkout hingga login SSH dalam beberapa langkah. Ikuti panduan singkat ini untuk menjalankan server pertama Anda.',
                'body'        => $deploy,
            ],
            [
                'title'       => 'Keamanan Server: SSH Key & Hardening Dasar',
                'category'    => 'Keamanan',
                'cover_image' => '/articles/keamanan-ssh-hardening-server.svg',
                'days_ago'    => 21,
                'reading_time' => 3,
                'excerpt'     => 'Tinggalkan password, mulai pakai SSH key. Empat langkah praktis untuk mengamankan VPS Anda dari percobaan login otomatis.',
                'body'        => $keamanan,
            ],
            [
                'title'       => 'Di Balik Layar: Data Center Jakarta & Jaminan SLA',
                'category'    => 'Infrastruktur',
                'cover_image' => '/articles/infrastruktur-data-center-jakarta.svg',
                'days_ago'    => 30,
                'reading_time' => 3,
                'excerpt'     => 'Mengapa lokasi server di Jakarta berarti latensi lebih rendah untuk pengguna Indonesia — dan komitmen SLA di balik setiap produk.',
                'body'        => $dataCenter,
            ],
            [
                'title'       => 'Memahami Billing, Invoice & Pembayaran di JadeNode',
                'category'    => 'Panduan',
                'cover_image' => '/articles/panduan-billing-invoice-pembayaran.svg',
                'days_ago'    => 38,
                'reading_time' => 3,
                'excerpt'     => 'Siklus bulanan dan tahunan, invoice otomatis, hingga riwayat transaksi — semua biaya transparan dalam Rupiah tanpa kejutan.',
                'body'        => $billing,
            ],
        ];
    }
}
